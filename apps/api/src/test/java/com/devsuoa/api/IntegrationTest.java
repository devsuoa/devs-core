package com.devsuoa.api;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Testcontainers;
import java.time.Duration;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

/**
 * Base for tests that run the whole API against a real Supabase Postgres, built from
 * db/migrations exactly as CI builds it, then seeded with db/seed/dev_seed.sql.
 * The API connects as api_app, so these tests also prove the role's grants are enough.
 * Skipped when Docker isn't available.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
@ExtendWith(org.springframework.test.context.junit.jupiter.SpringExtension.class)
public abstract class IntegrationTest {

    public static final String SUPABASE_URL = "http://supabase.test";
    public static final String JWT_SECRET = "test-secret-that-is-long-enough-for-hs256-signing";

    public static final UUID ADMIN = UUID.fromString("00000000-0000-4000-8000-000000000001");
    public static final UUID SUPERUSER = UUID.fromString("00000000-0000-4000-8000-000000000002");
    public static final UUID PLAIN_USER = UUID.fromString("00000000-0000-4000-8000-000000000003");

    public static final UUID FREE_EVENT = UUID.fromString("30000000-0000-4000-8000-000000000001");
    public static final UUID PAID_EVENT = UUID.fromString("30000000-0000-4000-8000-000000000002");
    public static final UUID TINY_EVENT = UUID.fromString("30000000-0000-4000-8000-000000000003");
    public static final UUID HIDDEN_EVENT = UUID.fromString("30000000-0000-4000-8000-000000000004");

    /**
     * A plain container rather than PostgreSQLContainer: the Supabase image's init scripts
     * break if POSTGRES_USER is set, which PostgreSQLContainer always does.
     */
    static final GenericContainer<?> DB = new GenericContainer<>(DockerImageName.parse("supabase/postgres:17.6.1.062"))
            .withEnv("POSTGRES_PASSWORD", "postgres")
            .withExposedPorts(5432)
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*\\s", 2)
                    .withStartupTimeout(Duration.ofMinutes(2)));

    static String jdbcUrl() {
        return "jdbc:postgresql://" + DB.getHost() + ":" + DB.getMappedPort(5432) + "/postgres";
    }

    static Path storageDir;

    static {
        DB.start();
        Path repo = Path.of("../..").toAbsolutePath().normalize();
        Flyway.configure()
                .dataSource(jdbcUrl(), "postgres", "postgres")
                .locations("filesystem:" + repo.resolve("db/migrations"), "filesystem:" + repo.resolve("db/callbacks"))
                .schemas("flyway")
                .outOfOrder(true)
                .validateMigrationNaming(true)
                .load()
                .migrate();
        try (Connection c = DriverManager.getConnection(jdbcUrl(), "postgres", "postgres");
                Statement s = c.createStatement()) {
            s.execute(Files.readString(repo.resolve("db/seed/dev_seed.sql")));
            s.execute("alter role api_app with password 'api_app'");
            storageDir = Files.createTempDirectory("devs-storage");
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", IntegrationTest::jdbcUrl);
        r.add("spring.datasource.username", () -> "api_app");
        r.add("spring.datasource.password", () -> "api_app");
        r.add("devs.supabase.url", () -> SUPABASE_URL);
        r.add("devs.supabase.jwt-secret", () -> JWT_SECRET);
        r.add("devs.storage.mode", () -> "local");
        r.add("devs.storage.local-dir", () -> storageDir.toString());
        r.add("devs.email.mode", () -> "log");
        r.add("devs.rate-limit.public-writes-per-minute", () -> "1000");
        r.add("devs.stripe.webhook-secret", () -> "whsec_test");
    }

    /** A token shaped like the ones Supabase Auth issues to logged-in users. */
    public static String token(UUID user) {
        return token(user, SUPABASE_URL + "/auth/v1", "authenticated", Instant.now().plusSeconds(600), JWT_SECRET);
    }

    public static String token(UUID user, String issuer, String role, Instant expires, String secret) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(user.toString())
                    .issuer(issuer)
                    .audience("authenticated")
                    .claim("role", role)
                    .claim("email", user + "@example.test")
                    .issueTime(new Date())
                    .expirationTime(Date.from(expires))
                    .build();
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret.getBytes()));
            return jwt.serialize();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    public static String bearer(UUID user) {
        return "Bearer " + token(user);
    }

    /** Runs SQL as the database owner, for test setup and for checking what was written. */
    public static <T> T sql(String query, Class<T> type) {
        try (Connection c = DriverManager.getConnection(jdbcUrl(), "postgres", "postgres");
                var rs = c.createStatement().executeQuery(query)) {
            return rs.next() ? rs.getObject(1, type) : null;
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
