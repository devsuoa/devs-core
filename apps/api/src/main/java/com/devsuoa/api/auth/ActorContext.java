package com.devsuoa.api.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import tools.jackson.databind.json.JsonMapper;

/**
 * Tells the database who is making a change, so the existing audit triggers
 * ({@code public.log_admin_action}) keep recording the real person.
 *
 * <p>Supabase's {@code auth.uid()} reads {@code request.jwt.claims}, and the trigger reads
 * {@code request.headers}. PostgREST used to set both; the API now sets them with
 * {@code set_config(..., true)}, which only lasts until the end of the current transaction.
 * Call {@link #bind()} first thing in every {@code @Transactional} method that writes.
 */
@Component
public class ActorContext {

    private final JdbcClient jdbc;
    private final JsonMapper json;

    public ActorContext(JdbcClient jdbc, JsonMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public void bind() {
        bind(null);
    }

    /** @param undoOf audit log id this change reverts, recorded in {@code admin_audit_log.undo_of} */
    public void bind(String undoOf) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            // Outside a transaction set_config would leak onto a pooled connection.
            throw new IllegalStateException("ActorContext.bind() must run inside a transaction");
        }

        Map<String, Object> claims = new LinkedHashMap<>();
        Auth.current().ifPresentOrElse(
                u -> {
                    claims.put("sub", u.id().toString());
                    claims.put("role", "authenticated");
                },
                () -> claims.put("role", "anon"));

        Map<String, Object> headers = new LinkedHashMap<>();
        HttpServletRequest request = currentRequest();
        if (request != null) {
            String userAgent = request.getHeader("User-Agent");
            headers.put("user-agent", userAgent == null ? "unknown" : truncate(userAgent, 300));
            headers.put("x-forwarded-for", request.getRemoteAddr());
        }
        headers.put("x-devs-api", "true");
        if (undoOf != null) headers.put("x-audit-undo", undoOf);

        // Older auth.uid() definitions read request.jwt.claim.sub, newer ones request.jwt.claims: set both.
        jdbc.sql("""
                select set_config('request.jwt.claims', :claims, true),
                       set_config('request.jwt.claim.sub', :sub, true),
                       set_config('request.headers', :headers, true)
                """)
                .param("claims", json.writeValueAsString(claims))
                .param("sub", (String) claims.getOrDefault("sub", ""))
                .param("headers", json.writeValueAsString(headers))
                .query()
                .listOfRows();
    }

    private static HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes a) return a.getRequest();
        return null;
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max);
    }
}
