package com.devsuoa.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.devsuoa.api.config.SecurityConfig;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Walks every endpoint the API exposes and checks who can reach it. A new endpoint is
 * covered automatically: if it isn't on the public list, anonymous callers must get 401,
 * and admin endpoints must turn away logged-in non-admins.
 */
class SecurityMatrixTest extends IntegrationTest {

    record Endpoint(String method, String pattern) {
        String concretePath() {
            return pattern.replaceAll("\\{[^}]+}", UUID.randomUUID().toString()).replace("/**", "/x");
        }
    }

    @Autowired MockMvc mvc;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping mappings;

    List<Endpoint> endpoints() {
        List<Endpoint> out = new ArrayList<>();
        for (RequestMappingInfo info : mappings.getHandlerMethods().keySet()) {
            for (String pattern : info.getPatternValues()) {
                if (!pattern.startsWith("/api/")) continue;
                for (var m : info.getMethodsCondition().getMethods()) out.add(new Endpoint(m.name(), pattern));
            }
        }
        return out;
    }

    static boolean isPublic(Endpoint e) {
        return SecurityConfig.PUBLIC_ENDPOINTS.stream().anyMatch(p -> p[0].equals(e.method()) && p[1].equals(e.pattern()));
    }

    @Test
    void everyEndpointIsPublicMeOrAdmin() {
        assertThat(endpoints()).isNotEmpty().allSatisfy(e -> assertThat(
                isPublic(e) || e.pattern().equals("/api/me") || e.pattern().startsWith("/api/admin/"))
                .as("%s %s must be on the public list or under /api/admin", e.method(), e.pattern())
                .isTrue());
    }

    @TestFactory
    Stream<DynamicTest> nonPublicEndpointsRejectAnonymousCallers() {
        return endpoints().stream().filter(e -> !isPublic(e)).map(e -> DynamicTest.dynamicTest(e.method() + " " + e.pattern(), () ->
                mvc.perform(request(HttpMethod.valueOf(e.method()), e.concretePath())
                                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                        .andExpect(status().isUnauthorized())));
    }

    @TestFactory
    Stream<DynamicTest> adminEndpointsRejectNonAdmins() {
        return endpoints().stream().filter(e -> e.pattern().startsWith("/api/admin/")).map(e ->
                DynamicTest.dynamicTest(e.method() + " " + e.pattern(), () ->
                        mvc.perform(request(HttpMethod.valueOf(e.method()), e.concretePath())
                                        .header("Authorization", bearer(PLAIN_USER))
                                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                                .andExpect(status().isForbidden())));
    }

    @TestFactory
    Stream<DynamicTest> superuserEndpointsRejectOrdinaryAdmins() {
        return endpoints().stream()
                .filter(e -> e.pattern().startsWith("/api/admin/audit-log") || e.pattern().startsWith("/api/admin/users"))
                .map(e -> DynamicTest.dynamicTest(e.method() + " " + e.pattern(), () ->
                        mvc.perform(request(HttpMethod.valueOf(e.method()), e.concretePath())
                                        .header("Authorization", bearer(ADMIN))
                                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                                .andExpect(status().isForbidden())));
    }

    @Test
    void rejectsTokensThatAreNotUserAccessTokens() throws Exception {
        String issuer = SUPABASE_URL + "/auth/v1";
        Instant later = Instant.now().plusSeconds(600);
        // The public anon key is itself a valid JWT, with role "anon".
        String anonRole = token(ADMIN, issuer, "anon", later, JWT_SECRET);
        String wrongIssuer = token(ADMIN, "https://evil.test/auth/v1", "authenticated", later, JWT_SECRET);
        String expired = token(ADMIN, issuer, "authenticated", Instant.now().minusSeconds(600), JWT_SECRET);
        String wrongKey = token(ADMIN, issuer, "authenticated", later, "some-other-secret-that-is-also-long-enough");

        for (String t : List.of(anonRole, wrongIssuer, expired, wrongKey, "not-a-jwt")) {
            mvc.perform(get("/api/admin/links").header("Authorization", "Bearer " + t)).andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/admin/links").header("Authorization", bearer(ADMIN))).andExpect(status().isOk());
    }

    @Test
    void adminRoleIsReadFromTheDatabaseOnEveryRequest() throws Exception {
        UUID demoted = ADMIN;
        String token = token(demoted);
        mvc.perform(get("/api/admin/links").header("Authorization", "Bearer " + token)).andExpect(status().isOk());
        sql("update public.profiles set role = 'user' where id = '" + demoted + "' returning 1", Integer.class);
        try {
            // Same, still-valid token: access ends as soon as the role is removed.
            mvc.perform(get("/api/admin/links").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
        } finally {
            sql("update public.profiles set role = 'admin' where id = '" + demoted + "' returning 1", Integer.class);
        }
    }
}
