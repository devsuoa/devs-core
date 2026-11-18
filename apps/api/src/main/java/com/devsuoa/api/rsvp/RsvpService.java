package com.devsuoa.api.rsvp;

import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import com.devsuoa.api.events.EventRepository;
import com.devsuoa.api.events.EventRepository.Event;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import tools.jackson.databind.node.ObjectNode;

/**
 * RSVP rules, all enforced here rather than in the browser:
 * the event is active, the leader is a member and hasn't already RSVP'd, the group fits the
 * event's group settings, there are enough seats, and answers match the event's questions.
 */
@Service
public class RsvpService {

    /** An RSVP that passed every rule and is ready to save. */
    public record Checked(Event event, String leaderEmail, List<String> emails, String dietary, ObjectNode answers) {

        public int seats() {
            return emails.size();
        }

        public boolean paid() {
            return event.paymentEnabled() && event.chargeAmount() != null && event.chargeAmount().signum() > 0;
        }
    }

    private final EventRepository events;
    private final JdbcClient jdbc;
    private final Json json;

    public RsvpService(EventRepository events, JdbcClient jdbc, Json json) {
        this.events = events;
        this.jdbc = jdbc;
        this.json = json;
    }

    /**
     * Checks every rule. Call inside a transaction with {@code lock = true} right before
     * saving, so the seat count can't change between the check and the insert.
     */
    public Checked check(UUID eventId, RsvpRequest r, boolean lock) {
        Event event = (lock ? events.findForUpdate(eventId) : events.find(eventId))
                .filter(Event::isActive)
                .orElseThrow(() -> ApiException.notFound("Event"));

        String leader = normalise(r.leaderEmail());
        LinkedHashSet<String> emails = new LinkedHashSet<>();
        emails.add(leader);
        r.groupEmails().forEach(e -> emails.add(normalise(e)));
        int seats = emails.size();

        if (!event.groupRsvpEnabled() && seats > 1) {
            throw ApiException.badRequest("group_rsvp_disabled", "Group RSVP is not enabled for this event.");
        }
        if (event.groupRsvpEnabled() && event.groupRsvpMaxEmails() != null && seats > event.groupRsvpMaxEmails()) {
            throw ApiException.badRequest("group_too_large", "The group is larger than this event allows.");
        }

        ObjectNode answers = RsvpQuestions.validateAnswers(RsvpQuestions.parse(event.rsvpQuestions()), r.answers());

        boolean member = jdbc.sql("select exists(select 1 from public.members where email = :e)")
                .param("e", leader).query(Boolean.class).single();
        if (!member) throw ApiException.conflict("not_member", "Please sign up as a member first.");

        boolean already = jdbc.sql("select exists(select 1 from public.events_rsvp where event_id = :ev and email = :e)")
                .param("ev", eventId).param("e", leader).query(Boolean.class).single();
        if (already) throw ApiException.conflict("already_rsvped", "You've already RSVP'd to this event.");

        if (event.maxAttendees() != null) {
            int taken = jdbc.sql("""
                    select coalesce(sum(greatest(1, jsonb_array_length(group_emails))), 0)
                    from public.events_rsvp where event_id = :ev
                    """)
                    .param("ev", eventId).query(Integer.class).single();
            if (taken + seats > event.maxAttendees()) throw ApiException.conflict("event_full", "This event is already full.");
        }

        String dietary = r.dietaryRequirements() == null || r.dietaryRequirements().isBlank() ? null : r.dietaryRequirements().trim();
        return new Checked(event, leader, List.copyOf(emails), dietary, answers);
    }

    /** Saves a checked RSVP. Must run in the same transaction as {@link #check} with the lock held. */
    public UUID insert(Checked c, String paymentMethod, String proofPath) {
        try {
            return jdbc.sql("""
                    insert into public.events_rsvp (event_id, email, dietary_requirements, group_emails, rsvp_answers,
                        payment_method, bank_payment_proof_path)
                    values (:ev, :email, :dietary, cast(:group as jsonb), cast(:answers as jsonb), :method, :proof)
                    returning id
                    """)
                    .param("ev", c.event().id())
                    .param("email", c.leaderEmail())
                    .param("dietary", c.dietary())
                    .param("group", json.write(c.emails()))
                    .param("answers", json.write(c.answers()))
                    .param("method", paymentMethod)
                    .param("proof", proofPath)
                    .query(UUID.class)
                    .single();
        } catch (DuplicateKeyException e) {
            throw ApiException.conflict("already_rsvped", "You've already RSVP'd to this event.");
        }
    }

    /** Card total: price per seat × seats, plus Stripe's fee passed on to the payer. Same formula as the site shows. */
    public static long cardTotalCents(BigDecimal pricePerSeat, int seats, BigDecimal feePercent, BigDecimal feeFixed) {
        BigDecimal base = pricePerSeat.multiply(BigDecimal.valueOf(seats));
        BigDecimal total = base.multiply(BigDecimal.ONE.add(feePercent)).add(feeFixed).setScale(2, RoundingMode.HALF_UP);
        return total.movePointRight(2).longValueExact();
    }

    static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
