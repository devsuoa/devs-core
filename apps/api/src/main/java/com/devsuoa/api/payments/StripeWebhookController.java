package com.devsuoa.api.payments;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import com.devsuoa.api.config.DevsProperties;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

/**
 * Stripe tells us here when a checkout is paid. Only requests signed with the webhook secret
 * are accepted. Handling is idempotent: Stripe retries, and a repeat delivery changes nothing.
 */
@RestController
public class StripeWebhookController {

    private static final Logger log = LoggerFactory.getLogger(StripeWebhookController.class);

    private record Pending(UUID id, UUID eventId, String leaderEmail, String dietary, List<String> groupEmails, JsonNode answers) {}

    private final DevsProperties props;
    private final JdbcClient jdbc;
    private final TransactionTemplate tx;
    private final ActorContext actor;
    private final Json json;

    public StripeWebhookController(DevsProperties props, JdbcClient jdbc, TransactionTemplate tx, ActorContext actor,
            Json json) {
        this.props = props;
        this.jdbc = jdbc;
        this.tx = tx;
        this.actor = actor;
        this.json = json;
    }

    @PostMapping("/api/webhooks/stripe")
    Map<String, Boolean> receive(@RequestBody String payload, @RequestHeader(name = "Stripe-Signature", required = false) String signature) {
        if (!StripeSignature.isValid(payload, signature, props.stripe().webhookSecret(), Instant.now())) {
            throw ApiException.badRequest("invalid_signature", "Invalid signature.");
        }
        JsonNode event = json.parse(payload);
        String type = event.path("type").asString();
        JsonNode session = event.path("data").path("object");
        String pendingId = session.path("metadata").path("pending_payment_id").asString();
        if (pendingId.isBlank()) return Map.of("received", true);

        switch (type) {
            case "checkout.session.completed", "checkout.session.async_payment_succeeded" -> {
                if ("paid".equals(session.path("payment_status").asString())) complete(UUID.fromString(pendingId), session.path("id").asString());
            }
            case "checkout.session.expired", "checkout.session.async_payment_failed" -> fail(UUID.fromString(pendingId), type);
            default -> { }
        }
        return Map.of("received", true);
    }

    private void complete(UUID pendingId, String sessionId) {
        Optional<String> problem = tx.execute(s -> {
            actor.bind();
            Optional<Pending> pending = lockPending(pendingId);
            if (pending.isEmpty()) return Optional.<String>empty(); // already handled

            // RSVP pod: re-check the saved answers, save the RSVP, then mark(pendingId, "completed", null, sessionId).
            // Until that's built, a paid checkout is kept as failed so an admin can refund it.
            mark(pendingId, "failed", "rsvp_not_built", sessionId);
            return Optional.of("rsvp_not_built");
        });
        problem.ifPresent(code -> log.warn("Paid checkout {} could not become an RSVP ({}); needs a refund", pendingId, code));
    }

    private void fail(UUID pendingId, String reason) {
        tx.executeWithoutResult(s -> {
            actor.bind();
            if (lockPending(pendingId).isPresent()) mark(pendingId, "failed", reason, null);
        });
    }

    private Optional<Pending> lockPending(UUID id) {
        return jdbc.sql("""
                select id, event_id, leader_email, dietary_requirements, to_jsonb(group_emails)::text as group_emails,
                       rsvp_answers::text as rsvp_answers
                from public.event_rsvp_pending_payments where id = :id and status = 'pending' for update
                """)
                .param("id", id)
                .query((rs, n) -> {
                    List<String> group = new ArrayList<>();
                    json.parse(rs.getString("group_emails")).forEach(e -> group.add(e.asString()));
                    return new Pending(
                            rs.getObject("id", UUID.class),
                            rs.getObject("event_id", UUID.class),
                            rs.getString("leader_email"),
                            rs.getString("dietary_requirements"),
                            group,
                            json.parse(rs.getString("rsvp_answers")));
                })
                .optional();
    }

    private void mark(UUID id, String status, String reason, String sessionId) {
        jdbc.sql("""
                update public.event_rsvp_pending_payments
                set status = :status, failure_reason = :reason, processed_at = now(),
                    stripe_checkout_session_id = coalesce(stripe_checkout_session_id, :sid)
                where id = :id
                """)
                .param("status", status).param("reason", reason).param("sid", sessionId).param("id", id)
                .update();
    }
}
