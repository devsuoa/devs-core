package com.devsuoa.api.config;

import com.devsuoa.api.common.GlobalExceptionHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

/**
 * Caps how often one IP can call the public write endpoints (sign up, RSVP, contact form),
 * which is what bots and enumeration scripts hammer. Counts reset every minute.
 *
 * <p>This is per instance and in memory. That is enough for one API instance; run it behind
 * the edge's rate limiting as well once there is more than one.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, AtomicInteger> counts = new ConcurrentHashMap<>();
    private final int perMinute;
    private final JsonMapper json;

    public RateLimitFilter(DevsProperties props, JsonMapper json) {
        this.perMinute = props.rateLimit().publicWritesPerMinute();
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return true;
        String path = request.getRequestURI();
        boolean publicWrite = path.equals("/api/members")
                || path.equals("/api/contact")
                || (path.startsWith("/api/events/") && path.contains("/rsvps"));
        return !publicWrite;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = request.getRemoteAddr();
        int n = counts.computeIfAbsent(key, k -> new AtomicInteger()).incrementAndGet();
        if (n > perMinute) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(json.writeValueAsString(GlobalExceptionHandler.problem(
                    HttpStatus.TOO_MANY_REQUESTS, "rate_limited", "Too many requests. Please wait a minute and try again.")));
            return;
        }
        chain.doFilter(request, response);
    }

    @Scheduled(fixedRate = 60_000)
    void reset() {
        counts.clear();
    }
}
