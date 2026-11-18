package com.devsuoa.api.config;

import java.math.BigDecimal;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * Refuses to start against a database that is missing migrations this code depends on.
 * The API never runs migrations itself: CI applies them (see kb/database_migrations.md).
 */
@Component
public class SchemaVersionCheck implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaVersionCheck.class);

    private final JdbcClient jdbc;
    private final DevsProperties props;

    public SchemaVersionCheck(JdbcClient jdbc, DevsProperties props) {
        this.jdbc = jdbc;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!props.schema().checkOnStartup()) return;
        BigDecimal required = new BigDecimal(props.schema().requiredVersion());

        Optional<BigDecimal> current;
        try {
            current = jdbc.sql("""
                    select max(cast(version as numeric)) from flyway.flyway_schema_history
                    where success and version is not null
                    """)
                    .query(BigDecimal.class)
                    .optional();
        } catch (RuntimeException e) {
            throw new IllegalStateException("Cannot read flyway.flyway_schema_history. Has the database been migrated?", e);
        }

        BigDecimal version = current.orElse(BigDecimal.ZERO);
        if (version.compareTo(required) < 0) {
            throw new IllegalStateException("Database is at migration " + version + " but this API needs " + required
                    + ". Apply the missing migrations in db/migrations first.");
        }
        log.info("Database schema at {} (needs {})", version, required);
    }
}
