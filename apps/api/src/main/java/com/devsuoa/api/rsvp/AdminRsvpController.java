package com.devsuoa.api.rsvp;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import com.devsuoa.api.storage.BlobStore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

/** The event attendees dashboard. */
@RestController
public class AdminRsvpController {

    public record EventSummary(UUID id, String title, LocalDate eventDate) {}

    public record Rsvp(
            UUID id,
            OffsetDateTime createdAt,
            UUID eventId,
            String email,
            String dietaryRequirements,
            JsonNode groupEmails,
            JsonNode rsvpAnswers,
            boolean present,
            String paymentMethod,
            boolean hasPaymentProof,
            EventSummary event) {}

    public record MemberSummary(String email, String firstName, String lastName, Long studentId, String upi) {}

    public record Attendees(List<Rsvp> rsvps, List<MemberSummary> members) {}

    public record Presence(@NotNull Boolean present) {}

    private final JdbcClient jdbc;
    private final Json json;
    private final ActorContext actor;
    private final BlobStore store;

    public AdminRsvpController(JdbcClient jdbc, Json json, ActorContext actor, BlobStore store) {
        this.jdbc = jdbc;
        this.json = json;
        this.actor = actor;
        this.store = store;
    }

    /** RSVPs, newest first, plus the member details of everyone named on them (leaders and group). */
    @GetMapping("/api/admin/rsvps")
    Attendees list(@RequestParam(name = "event_id", required = false) UUID eventId) {
        List<Rsvp> rsvps = jdbc.sql("""
                select r.id, r.created_at, r.event_id, r.email, r.dietary_requirements, r.group_emails::text as group_emails,
                       r.rsvp_answers::text as rsvp_answers, r.present, r.payment_method,
                       r.bank_payment_proof_path is not null as has_proof,
                       e.title, e.event_date
                from public.events_rsvp r
                left join public.events e on e.id = r.event_id
                where cast(:eventId as uuid) is null or r.event_id = :eventId
                order by r.created_at desc
                """)
                .param("eventId", eventId)
                .query((rs, n) -> new Rsvp(
                        rs.getObject("id", UUID.class),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getObject("event_id", UUID.class),
                        rs.getString("email"),
                        rs.getString("dietary_requirements"),
                        json.parse(rs.getString("group_emails")),
                        json.parse(rs.getString("rsvp_answers")),
                        rs.getBoolean("present"),
                        rs.getString("payment_method"),
                        rs.getBoolean("has_proof"),
                        new EventSummary(rs.getObject("event_id", UUID.class), rs.getString("title"),
                                rs.getObject("event_date", LocalDate.class))))
                .list();

        Set<String> emails = new LinkedHashSet<>();
        for (Rsvp r : rsvps) {
            emails.add(r.email().toLowerCase(Locale.ROOT));
            if (r.groupEmails().isArray()) r.groupEmails().forEach(e -> emails.add(e.asString().trim().toLowerCase(Locale.ROOT)));
        }
        List<MemberSummary> members = emails.isEmpty() ? List.of() : jdbc.sql("""
                select email, first_name, last_name, student_id, upi from public.members
                where lower(email) = any(array(select jsonb_array_elements_text(cast(:emails as jsonb))))
                """)
                .param("emails", json.write(new ArrayList<>(emails)))
                .query((rs, n) -> new MemberSummary(rs.getString("email"), rs.getString("first_name"), rs.getString("last_name"),
                        (Long) rs.getObject("student_id"), rs.getString("upi")))
                .list();
        return new Attendees(rsvps, members);
    }

    @PatchMapping("/api/admin/rsvps/{id}/present")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void setPresent(@PathVariable UUID id, @Valid @RequestBody Presence body) {
        actor.bind();
        int n = jdbc.sql("update public.events_rsvp set present = :present where id = :id")
                .param("present", body.present()).param("id", id)
                .update();
        if (n == 0) throw ApiException.notFound("RSVP");
    }

    /** The bank transfer screenshot for one RSVP, streamed to the admin. Never cached, never a public link. */
    @GetMapping("/api/admin/rsvps/{id}/payment-proof")
    ResponseEntity<byte[]> paymentProof(@PathVariable UUID id) {
        String path = jdbc.sql("select bank_payment_proof_path from public.events_rsvp where id = :id")
                .param("id", id)
                .query(String.class)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Payment proof"));
        BlobStore.Blob blob = store.get(BlobStore.PAYMENT_PROOFS, path).orElseThrow(() -> ApiException.notFound("Payment proof"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(blob.contentType()))
                .cacheControl(CacheControl.noStore())
                .header("Content-Disposition", "inline")
                .body(blob.bytes());
    }
}
