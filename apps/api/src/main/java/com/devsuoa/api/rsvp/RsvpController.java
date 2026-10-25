package com.devsuoa.api.rsvp;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import com.devsuoa.api.config.DevsProperties;
import com.devsuoa.api.payments.StripeClient;
import com.devsuoa.api.rsvp.RsvpService.Checked;
import com.devsuoa.api.storage.BlobStore;
import com.devsuoa.api.storage.ImageFile;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Public RSVP endpoints: free events, bank transfer, and card checkout through Stripe. */
@RestController
public class RsvpController {

    private static final Logger log = LoggerFactory.getLogger(RsvpController.class);

    private final RsvpService rsvps;
    private final ActorContext actor;
    private final BlobStore store;
    private final StripeClient stripe;
    private final JdbcClient jdbc;
    private final TransactionTemplate tx;
    private final DevsProperties props;
    private final Json json;

    public RsvpController(RsvpService rsvps, ActorContext actor, BlobStore store, StripeClient stripe, JdbcClient jdbc,
            TransactionTemplate tx, DevsProperties props, Json json) {
        this.json = json;
        this.rsvps = rsvps;
        this.actor = actor;
        this.store = store;
        this.stripe = stripe;
        this.jdbc = jdbc;
        this.tx = tx;
        this.props = props;
    }

    /** RSVP to a free event. Paid events must go through bank transfer or checkout. */
    @PostMapping("/api/events/{eventId}/rsvps")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Map<String, UUID> free(@PathVariable UUID eventId, @Valid @RequestBody RsvpRequest request) {
        actor.bind();
        Checked c = rsvps.check(eventId, request, true);
        if (c.paid()) throw ApiException.badRequest("payment_required", "This event needs payment to RSVP.");
        return Map.of("id", rsvps.insert(c, null, null));
    }

    /**
     * RSVP with a bank transfer screenshot, in one request. The screenshot goes to the private
     * bucket under a random name (no email in it) and only admins can view it, through the API.
     */
    @PostMapping(path = "/api/events/{eventId}/rsvps/bank-transfer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    Map<String, UUID> bankTransfer(
            @PathVariable UUID eventId,
            @Valid @RequestPart("rsvp") RsvpRequest request,
            @RequestPart("proof") MultipartFile proof) {
        // Check the rules before storing anything, then again with the lock held.
        Checked first = rsvps.check(eventId, request, false);
        requireBankTransfer(first);
        ImageFile image = ImageFile.from(proof);

        String path = "proofs/" + eventId + "/" + image.randomName();
        store.put(BlobStore.PAYMENT_PROOFS, path, image.bytes(), image.contentType());
        try {
            UUID id = tx.execute(s -> {
                actor.bind();
                Checked c = rsvps.check(eventId, request, true);
                requireBankTransfer(c);
                return rsvps.insert(c, "bank_transfer", path);
            });
            return Map.of("id", id);
        } catch (RuntimeException e) {
            try {
                store.delete(BlobStore.PAYMENT_PROOFS, path);
            } catch (RuntimeException cleanup) {
                log.warn("Could not delete orphaned payment proof {}", path, cleanup);
            }
            throw e;
        }
    }

    /**
     * Starts a card payment. The RSVP is only created when Stripe confirms payment
     * (see {@code StripeWebhookController}). Prices and redirect URLs are set here, never by the browser.
     */
    @PostMapping("/api/events/{eventId}/rsvps/checkout")
    Map<String, String> checkout(@PathVariable UUID eventId, @Valid @RequestBody RsvpRequest request) {
        Checked c = rsvps.check(eventId, request, false);
        if (!c.paid()) throw ApiException.badRequest("payment_not_required", "This event is free to RSVP.");

        long cents = RsvpService.cardTotalCents(c.event().chargeAmount(), c.seats(),
                props.stripe().cardFeePercent(), props.stripe().cardFeeFixed());

        UUID pendingId = tx.execute(s -> {
            actor.bind();
            return jdbc.sql("""
                    insert into public.event_rsvp_pending_payments (event_id, leader_email, dietary_requirements, group_emails, rsvp_answers)
                    values (:ev, :leader, :dietary, array(select jsonb_array_elements_text(cast(:group as jsonb))),
                            cast(:answers as jsonb))
                    returning id
                    """)
                    .param("ev", eventId)
                    .param("leader", c.leaderEmail())
                    .param("dietary", c.dietary())
                    .param("group", json.write(c.emails()))
                    .param("answers", c.answers().toString())
                    .query(UUID.class)
                    .single();
        });

        String site = props.siteUrl().replaceAll("/+$", "");
        StripeClient.Session session = stripe.createCheckoutSession(new StripeClient.CheckoutRequest(
                pendingId,
                eventId,
                c.leaderEmail(),
                c.event().title() + (c.seats() > 1 ? " RSVP (" + c.seats() + " people)" : " RSVP"),
                cents,
                site + "/events?rsvp_paid=1#" + eventId,
                site + "/events#" + eventId));

        jdbc.sql("update public.event_rsvp_pending_payments set stripe_checkout_session_id = :sid where id = :id")
                .param("sid", session.id()).param("id", pendingId).update();
        return Map.of("checkout_url", session.url());
    }

    private static void requireBankTransfer(Checked c) {
        if (!c.paid() || !c.event().bankTransferEnabled()) {
            throw ApiException.badRequest("bank_transfer_unavailable", "Bank transfer isn't available for this event.");
        }
    }
}
