package com.devsuoa.api.events;

import com.devsuoa.api.common.Json;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.JsonNode;

@Repository
public class EventRepository {

    /** Every column. Only admin endpoints return this. */
    public record Event(
            UUID id,
            String title,
            String description,
            String imageUrl,
            String tag,
            LocalDate eventDate,
            String eventTime,
            String location,
            String registerUrl,
            boolean isActive,
            OffsetDateTime createdAt,
            Integer maxAttendees,
            boolean groupRsvpEnabled,
            Integer groupRsvpMaxEmails,
            JsonNode rsvpQuestions,
            boolean paymentEnabled,
            BigDecimal chargeAmount,
            boolean bankTransferEnabled,
            String bankAccountName,
            String bankAccountNumber) {}

    /** What visitors see. Leaves out internal fields such as the linked Google Sheet. */
    public record PublicEvent(
            UUID id,
            String title,
            String description,
            String imageUrl,
            String tag,
            LocalDate eventDate,
            String eventTime,
            String location,
            String registerUrl,
            Integer maxAttendees,
            boolean groupRsvpEnabled,
            Integer groupRsvpMaxEmails,
            boolean paymentEnabled,
            BigDecimal chargeAmount,
            boolean bankTransferEnabled,
            JsonNode rsvpQuestions,
            boolean isActive) {

        static PublicEvent of(Event e) {
            return new PublicEvent(e.id(), e.title(), e.description(), e.imageUrl(), e.tag(), e.eventDate(), e.eventTime(),
                    e.location(), e.registerUrl(), e.maxAttendees(), e.groupRsvpEnabled(), e.groupRsvpMaxEmails(),
                    e.paymentEnabled(), e.chargeAmount(), e.bankTransferEnabled(), e.rsvpQuestions(), e.isActive());
        }
    }

    private static final String COLUMNS = """
            id, title, description, image_url, tag, event_date, event_time, location, register_url,
            coalesce(is_active, false) as is_active, created_at, max_attendees, group_rsvp_enabled,
            group_rsvp_max_emails, rsvp_questions::text as rsvp_questions, payment_enabled, charge_amount,
            bank_transfer_enabled, bank_account_name, bank_account_number
            """;

    private final JdbcClient jdbc;
    private final Json json;

    public EventRepository(JdbcClient jdbc, Json json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public List<Event> active() {
        return jdbc.sql("select " + COLUMNS + " from public.events where is_active order by event_date asc")
                .query(this::map)
                .list();
    }

    public List<Event> all() {
        return jdbc.sql("select " + COLUMNS + " from public.events order by event_date desc").query(this::map).list();
    }

    public Optional<Event> find(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from public.events where id = :id").param("id", id).query(this::map).optional();
    }

    /** Locks the event row for the rest of the transaction, so capacity checks can't race. */
    public Optional<Event> findForUpdate(UUID id) {
        return jdbc.sql("select " + COLUMNS + " from public.events where id = :id for update")
                .param("id", id)
                .query(this::map)
                .optional();
    }

    public Event insert(EventForm f, String questionsJson) {
        return jdbc.sql("""
                insert into public.events (title, description, image_url, tag, event_date, event_time, location,
                    register_url, is_active, max_attendees, group_rsvp_enabled, group_rsvp_max_emails, rsvp_questions,
                    payment_enabled, charge_amount, bank_transfer_enabled, bank_account_name, bank_account_number)
                values (:title, :description, :imageUrl, :tag, :eventDate, :eventTime, :location,
                    :registerUrl, :isActive, :maxAttendees, :groupRsvpEnabled, :groupRsvpMaxEmails, cast(:questions as jsonb),
                    :paymentEnabled, :chargeAmount, :bankTransferEnabled, null, null)
                returning
                """ + COLUMNS)
                .params(params(f, questionsJson))
                .query(this::map)
                .single();
    }

    public boolean update(UUID id, EventForm f, String questionsJson) {
        return jdbc.sql("""
                update public.events set
                    title = :title, description = :description, image_url = :imageUrl, tag = :tag,
                    event_date = :eventDate, event_time = :eventTime, location = :location, register_url = :registerUrl,
                    is_active = :isActive, max_attendees = :maxAttendees, group_rsvp_enabled = :groupRsvpEnabled,
                    group_rsvp_max_emails = :groupRsvpMaxEmails, rsvp_questions = cast(:questions as jsonb),
                    payment_enabled = :paymentEnabled, charge_amount = :chargeAmount,
                    bank_transfer_enabled = :bankTransferEnabled, bank_account_name = null, bank_account_number = null
                where id = :id
                """)
                .params(params(f, questionsJson))
                .param("id", id)
                .update() == 1;
    }

    private static java.util.Map<String, Object> params(EventForm f, String questionsJson) {
        java.util.Map<String, Object> p = new java.util.HashMap<>();
        p.put("title", f.title());
        p.put("description", f.description());
        p.put("imageUrl", f.imageUrl());
        p.put("tag", f.tag());
        p.put("eventDate", f.eventDate());
        p.put("eventTime", f.eventTime());
        p.put("location", f.location());
        p.put("registerUrl", f.registerUrl());
        p.put("isActive", f.isActive());
        p.put("maxAttendees", f.maxAttendees());
        p.put("groupRsvpEnabled", f.groupRsvpEnabled());
        p.put("groupRsvpMaxEmails", f.groupRsvpMaxEmails());
        p.put("paymentEnabled", f.paymentEnabled());
        p.put("chargeAmount", f.chargeAmount());
        p.put("bankTransferEnabled", f.bankTransferEnabled());
        p.put("questions", questionsJson);
        return p;
    }

    public boolean delete(UUID id) {
        return jdbc.sql("delete from public.events where id = :id").param("id", id).update() == 1;
    }

    private Event map(ResultSet rs, int row) throws SQLException {
        return new Event(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("image_url"),
                rs.getString("tag"),
                rs.getObject("event_date", LocalDate.class),
                rs.getString("event_time"),
                rs.getString("location"),
                rs.getString("register_url"),
                rs.getBoolean("is_active"),
                rs.getObject("created_at", OffsetDateTime.class),
                (Integer) rs.getObject("max_attendees"),
                rs.getBoolean("group_rsvp_enabled"),
                (Integer) rs.getObject("group_rsvp_max_emails"),
                json.parse(rs.getString("rsvp_questions")),
                rs.getBoolean("payment_enabled"),
                rs.getBigDecimal("charge_amount"),
                rs.getBoolean("bank_transfer_enabled"),
                rs.getString("bank_account_name"),
                rs.getString("bank_account_number"));
    }
}
