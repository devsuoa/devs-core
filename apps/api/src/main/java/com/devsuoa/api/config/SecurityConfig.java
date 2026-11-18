package com.devsuoa.api.config;

import com.devsuoa.api.auth.ProfileAuthenticationConverter;
import com.devsuoa.api.common.GlobalExceptionHandler;
import java.nio.charset.StandardCharsets;
import java.util.List;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AnonymousAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.json.JsonMapper;

/**
 * Who may call what. Everything not listed as public needs a valid Supabase JWT, and
 * anything not matched at all is denied, so a new endpoint is closed until someone opens it.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    /** Endpoints anyone may call without logging in. Kept in one place so the tests can check it. */
    public static final List<String[]> PUBLIC_ENDPOINTS = List.of(
            new String[] {"GET", "/api/health"},
            new String[] {"GET", "/api/events"},
            new String[] {"GET", "/api/links"},
            new String[] {"GET", "/api/degrees"},
            new String[] {"GET", "/api/degrees/{degreeId}/majors"},
            new String[] {"POST", "/api/members"},
            new String[] {"POST", "/api/events/{eventId}/rsvps"},
            new String[] {"POST", "/api/events/{eventId}/rsvps/bank-transfer"},
            new String[] {"POST", "/api/events/{eventId}/rsvps/checkout"},
            new String[] {"POST", "/api/contact"},
            new String[] {"POST", "/api/webhooks/stripe"},
            new String[] {"GET", "/api/files/public/{bucket}/**"});

    @Bean
    SecurityFilterChain api(
            HttpSecurity http,
            ProfileAuthenticationConverter converter,
            RateLimitFilter rateLimit,
            JsonMapper json) throws Exception {
        http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Bearer tokens in a header, no cookies: CSRF does not apply.
                .csrf(c -> c.disable())
                .cors(c -> {})
                .httpBasic(b -> b.disable())
                .formLogin(f -> f.disable())
                .logout(l -> l.disable())
                .headers(h -> h
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .referrerPolicy(r -> r.policy(
                                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)))
                .authorizeHttpRequests(a -> {
                    for (String[] e : PUBLIC_ENDPOINTS) a.requestMatchers(HttpMethod.valueOf(e[0]), e[1]).permitAll();
                    a.requestMatchers(HttpMethod.GET, "/internal/health").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/me").authenticated()
                            .requestMatchers("/api/admin/audit-log/**", "/api/admin/users/**").hasRole("SUPERUSER")
                            .requestMatchers("/api/admin/**").hasRole("ADMIN")
                            .anyRequest().denyAll();
                })
                .oauth2ResourceServer(o -> o
                        .jwt(j -> j.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint((req, res, ex) -> writeProblem(res, json, HttpStatus.UNAUTHORIZED, "unauthenticated", "Please log in."))
                        .accessDeniedHandler((req, res, ex) -> writeProblem(res, json, HttpStatus.FORBIDDEN, "forbidden", "You don't have access to this.")))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> writeProblem(res, json, HttpStatus.UNAUTHORIZED, "unauthenticated", "Please log in."))
                        .accessDeniedHandler((req, res, ex) -> writeProblem(res, json, HttpStatus.FORBIDDEN, "forbidden", "You don't have access to this.")))
                .addFilterBefore(rateLimit, AnonymousAuthenticationFilter.class);
        return http.build();
    }

    private static void writeProblem(jakarta.servlet.http.HttpServletResponse res, JsonMapper json, HttpStatus status, String code, String detail)
            throws java.io.IOException {
        res.setStatus(status.value());
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        res.getWriter().write(json.writeValueAsString(GlobalExceptionHandler.problem(status, code, detail)));
    }

    /**
     * Verifies Supabase access tokens. Projects on the legacy JWT secret sign with HS256;
     * projects on the newer signing keys publish a JWKS. Either way the token must be issued
     * by this project's Auth server, for the {@code authenticated} audience and role, which
     * rules out the public anon key (also a JWT, but with role {@code anon}).
     */
    @Bean
    JwtDecoder jwtDecoder(DevsProperties props) {
        String base = props.supabase().url().replaceAll("/+$", "");
        if (base.isBlank()) throw new IllegalStateException("SUPABASE_URL is not set");
        String issuer = base + "/auth/v1";

        NimbusJwtDecoder decoder;
        String secret = props.supabase().jwtSecret();
        if (secret != null && !secret.isBlank()) {
            if (secret.length() < 32) throw new IllegalStateException("SUPABASE_JWT_SECRET is too short");
            decoder = NimbusJwtDecoder.withSecretKey(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
        } else {
            decoder = NimbusJwtDecoder.withJwkSetUri(issuer + "/.well-known/jwks.json")
                    .jwsAlgorithms(algs -> {
                        algs.add(SignatureAlgorithm.ES256);
                        algs.add(SignatureAlgorithm.RS256);
                    })
                    .build();
        }

        OAuth2TokenValidator<Jwt> audienceAndRole = jwt -> {
            boolean audienceOk = jwt.getAudience() != null && jwt.getAudience().contains("authenticated");
            boolean roleOk = "authenticated".equals(jwt.getClaimAsString("role"));
            boolean subjectOk = jwt.getSubject() != null && jwt.getSubject().matches("[0-9a-fA-F-]{36}");
            if (audienceOk && roleOk && subjectOk) return OAuth2TokenValidatorResult.success();
            return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Not a user access token", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(issuer), audienceAndRole));
        return decoder;
    }

    /** The rate limiter runs inside the security chain only, not a second time as a plain servlet filter. */
    @Bean
    org.springframework.boot.web.servlet.FilterRegistrationBean<RateLimitFilter> rateLimitRegistration(RateLimitFilter f) {
        var registration = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(f);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(DevsProperties props) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(props.corsAllowedOrigins());
        cors.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        cors.setAllowCredentials(false);
        cors.setMaxAge(600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }
}
