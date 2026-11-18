package com.devsuoa.api.marketing;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.auth.Auth;
import com.devsuoa.api.auth.CurrentUser;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.config.DevsProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

/**
 * Marketing requests from execs. One call saves the request, adds a task to the marketing
 * team's board, and forwards it to the Google Sheet (whose Apps Script sends the emails).
 * Replaces the browser-side insert, the create-marketing-task edge function and the
 * browser's direct Apps Script call (whose URL was public in the JS bundle).
 */
@RestController
public class MarketingController {

    private static final Logger log = LoggerFactory.getLogger(MarketingController.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    public record Request(
            @NotNull @Pattern(regexp = "event|sponsorship") String postType,
            @Size(max = 200) String eventName,
            @Size(max = 20) String eventDate,
            @Size(max = 100) String eventTime,
            @Size(max = 300) String eventLocation,
            @Size(max = 10_000) String eventDescription,
            @Size(max = 10_000) String eventSuggestions,
            @Size(max = 200) String sponsorName,
            @Size(max = 20) String sponsorshipEmailDate,
            @Size(max = 20) String sponsorshipPostDate,
            @Size(max = 200) String sponsorshipEventName,
            @Size(max = 5_000) String sponsorshipLinks,
            @Size(max = 10_000) String sponsorshipDescription,
            @Size(max = 10_000) String marketingDescription,
            @Size(max = 10_000) String preWrittenCaptions) {}

    public record Result(UUID id, String taskId, boolean sheetUpdated) {}

    private final JdbcClient jdbc;
    private final ActorContext actor;
    private final TransactionTemplate tx;
    private final RestClient http;
    private final String appsScriptUrl;

    public MarketingController(JdbcClient jdbc, ActorContext actor, TransactionTemplate tx, DevsProperties props,
            RestClient.Builder builder) {
        this.jdbc = jdbc;
        this.actor = actor;
        this.tx = tx;
        this.http = builder.clone().build();
        this.appsScriptUrl = props.marketing().appsScriptUrl();
    }

    @PostMapping("/api/admin/marketing-requests")
    @ResponseStatus(HttpStatus.CREATED)
    Result submit(@Valid @RequestBody Request r) {
        CurrentUser me = Auth.require();
        boolean event = r.postType().equals("event");
        LocalDate eventDate = date(r.eventDate());
        LocalDate emailDate = date(r.sponsorshipEmailDate());
        LocalDate postDate = date(r.sponsorshipPostDate());

        String title = event ? nonBlank(r.eventName(), "Event") : nonBlank(r.sponsorName(), "Sponsor");
        String taskId = "mkt-" + HexFormat.of().formatHex(randomBytes(6));

        UUID id = tx.execute(s -> {
            actor.bind();
            UUID requestId = jdbc.sql("""
                    insert into public.marketing_requests (post_type, event_name, event_date, event_time, event_location,
                        event_description, event_suggestions, sponsor_name, sponsorship_email_date, sponsorship_post_date,
                        sponsorship_event_name, sponsorship_links, sponsorship_description, marketing_description,
                        pre_written_captions, created_by)
                    values (:postType, :eventName, :eventDate, :eventTime, :eventLocation, :eventDescription, :eventSuggestions,
                        :sponsorName, :emailDate, :postDate, :sponsorshipEventName, :sponsorshipLinks, :sponsorshipDescription,
                        :marketingDescription, :captions, :createdBy)
                    returning id
                    """)
                    .param("postType", r.postType())
                    .param("eventName", event ? r.eventName() : null)
                    .param("eventDate", event ? eventDate : null)
                    .param("eventTime", event ? r.eventTime() : null)
                    .param("eventLocation", event ? r.eventLocation() : null)
                    .param("eventDescription", event ? r.eventDescription() : null)
                    .param("eventSuggestions", event ? r.eventSuggestions() : null)
                    .param("sponsorName", event ? null : r.sponsorName())
                    .param("emailDate", event ? null : emailDate)
                    .param("postDate", event ? null : postDate)
                    .param("sponsorshipEventName", event ? null : r.sponsorshipEventName())
                    .param("sponsorshipLinks", event ? null : r.sponsorshipLinks())
                    .param("sponsorshipDescription", event ? null : r.sponsorshipDescription())
                    .param("marketingDescription", r.marketingDescription())
                    .param("captions", r.preWrittenCaptions())
                    .param("createdBy", me.id())
                    .query(UUID.class)
                    .single();

            jdbc.sql("""
                    insert into public.tasks (id, name, label, assignee, status, description, team, "order", archived, due_date)
                    values (:id, :name, :label, null, 'todo', :description, 'marketing',
                            (select coalesce(max("order") + 1, 0) from public.tasks where team = 'marketing' and status = 'todo'),
                            false, :due)
                    """)
                    .param("id", taskId)
                    .param("name", (event ? "Marketing: " : "Sponsor post: ") + title)
                    .param("label", event ? "event" : "sponsorship")
                    .param("description", "Requested by " + me.displayName() + ".\n\n" + nonBlank(r.marketingDescription(), ""))
                    .param("due", event ? eventDate : postDate)
                    .update();
            return requestId;
        });

        return new Result(id, taskId, forwardToSheet(r));
    }

    /** Best effort: the request is saved either way, and the response says whether the sheet got it. */
    private boolean forwardToSheet(Request r) {
        if (appsScriptUrl == null || appsScriptUrl.isBlank()) return false;
        // The Apps Script expects the same camelCase fields the browser used to send.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("postType", r.postType());
        body.put("eventName", r.eventName());
        body.put("eventDate", r.eventDate());
        body.put("eventTime", r.eventTime());
        body.put("eventLocation", r.eventLocation());
        body.put("eventDescription", r.eventDescription());
        body.put("eventSuggestions", r.eventSuggestions());
        body.put("sponsorName", r.sponsorName());
        body.put("sponsorshipEmailDate", r.sponsorshipEmailDate());
        body.put("sponsorshipPostDate", r.sponsorshipPostDate());
        body.put("sponsorshipEventName", r.sponsorshipEventName());
        body.put("sponsorshipLinks", r.sponsorshipLinks());
        body.put("sponsorshipDescription", r.sponsorshipDescription());
        body.put("marketingDescription", r.marketingDescription());
        body.put("preWrittenCaptions", r.preWrittenCaptions());
        try {
            http.post().uri(appsScriptUrl).contentType(MediaType.APPLICATION_JSON).body(body).retrieve().toBodilessEntity();
            return true;
        } catch (RuntimeException e) {
            log.warn("Could not forward marketing request to the Google Sheet", e);
            return false;
        }
    }

    private static LocalDate date(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("invalid_date", "Dates must look like 2026-10-26.");
        }
    }

    private static String nonBlank(String s, String fallback) {
        return s == null || s.isBlank() ? fallback : s.trim();
    }

    private static byte[] randomBytes(int n) {
        byte[] b = new byte[n];
        RANDOM.nextBytes(b);
        return b;
    }
}
