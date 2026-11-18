package com.devsuoa.api.todos;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.auth.Auth;
import com.devsuoa.api.auth.CurrentUser;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Urls;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Per-event planning page: checklist, notes, document links and checklist comments. */
@RestController
public class EventTodoController {

    public record TodoItem(UUID id, UUID eventId, String label, boolean completed, boolean isDefault, int order,
            String itemNotes, OffsetDateTime createdAt) {}

    public record Note(UUID id, UUID eventId, String content, OffsetDateTime updatedAt) {}

    public record DocLink(UUID id, UUID eventId, String title, String url, OffsetDateTime createdAt) {}

    public record Comment(UUID id, UUID todoItemId, UUID authorId, String authorName, String message, OffsetDateTime createdAt) {}

    public record NewItem(@NotBlank @Size(max = 300) String label) {}

    /** Only the fields present are changed. */
    public record ItemChange(Boolean completed, @Size(max = 300) String label, @Size(max = 10_000) String itemNotes) {}

    public record NoteBody(@NotNull @Size(max = 50_000) String content) {}

    public record NewDocLink(@NotBlank @Size(max = 200) String title, @NotBlank @Size(max = 2000) String url) {}

    public record NewComment(@NotBlank @Size(max = 5000) String message) {}

    static final List<String> DEFAULT_ITEMS = List.of(
            "Room booking form submitted", "Marketing request submitted", "Catering ordered", "Budget approved");

    private final JdbcClient jdbc;
    private final ActorContext actor;

    public EventTodoController(JdbcClient jdbc, ActorContext actor) {
        this.jdbc = jdbc;
        this.actor = actor;
    }

    /** The checklist, created with the default items the first time an event's page is opened. */
    @GetMapping("/api/admin/events/{eventId}/todos")
    @Transactional
    List<TodoItem> items(@PathVariable UUID eventId) {
        requireEvent(eventId);
        List<TodoItem> items = loadItems(eventId);
        if (!items.isEmpty()) return items;

        actor.bind();
        // Two tabs opening the page at once must not both seed: serialise on the event id.
        jdbc.sql("select pg_advisory_xact_lock(hashtext(:k))").param("k", "todos:" + eventId).query().listOfRows();
        items = loadItems(eventId);
        if (!items.isEmpty()) return items;
        for (int i = 0; i < DEFAULT_ITEMS.size(); i++) {
            jdbc.sql("""
                    insert into public.event_todo_items (event_id, label, completed, is_default, "order", item_notes)
                    values (:ev, :label, false, true, :order, '')
                    """)
                    .param("ev", eventId).param("label", DEFAULT_ITEMS.get(i)).param("order", i)
                    .update();
        }
        return loadItems(eventId);
    }

    @PostMapping("/api/admin/events/{eventId}/todos")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    TodoItem addItem(@PathVariable UUID eventId, @Valid @RequestBody NewItem body) {
        actor.bind();
        requireEvent(eventId);
        return jdbc.sql("""
                insert into public.event_todo_items (event_id, label, completed, is_default, "order", item_notes)
                values (:ev, :label, false, false,
                        (select coalesce(max("order") + 1, 0) from public.event_todo_items where event_id = :ev), '')
                returning id, event_id, label, completed, is_default, "order", item_notes, created_at
                """)
                .param("ev", eventId).param("label", body.label().trim())
                .query(EventTodoController::item)
                .single();
    }

    @PatchMapping("/api/admin/todos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void changeItem(@PathVariable UUID id, @Valid @RequestBody ItemChange body) {
        actor.bind();
        if (body.label() != null && body.label().isBlank()) throw ApiException.badRequest("label_required", "The item needs a label.");
        int n = jdbc.sql("""
                update public.event_todo_items set
                    completed = coalesce(:completed, completed),
                    label = coalesce(:label, label),
                    item_notes = coalesce(:notes, item_notes)
                where id = :id
                """)
                .param("completed", body.completed())
                .param("label", body.label() == null ? null : body.label().trim())
                .param("notes", body.itemNotes())
                .param("id", id)
                .update();
        if (n == 0) throw ApiException.notFound("Checklist item");
    }

    @DeleteMapping("/api/admin/todos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void deleteItem(@PathVariable UUID id) {
        actor.bind();
        if (jdbc.sql("delete from public.event_todo_items where id = :id").param("id", id).update() == 0) {
            throw ApiException.notFound("Checklist item");
        }
    }

    @GetMapping("/api/admin/events/{eventId}/note")
    Note note(@PathVariable UUID eventId) {
        return jdbc.sql("select id, event_id, content, updated_at from public.event_notes where event_id = :ev")
                .param("ev", eventId)
                .query(EventTodoController::note)
                .optional()
                .orElse(null);
    }

    @PutMapping("/api/admin/events/{eventId}/note")
    @Transactional
    Note saveNote(@PathVariable UUID eventId, @Valid @RequestBody NoteBody body) {
        actor.bind();
        requireEvent(eventId);
        return jdbc.sql("""
                insert into public.event_notes (event_id, content, updated_at) values (:ev, :content, now())
                on conflict (event_id) do update set content = excluded.content, updated_at = now()
                returning id, event_id, content, updated_at
                """)
                .param("ev", eventId).param("content", body.content())
                .query(EventTodoController::note)
                .single();
    }

    @GetMapping("/api/admin/events/{eventId}/doc-links")
    List<DocLink> docLinks(@PathVariable UUID eventId) {
        return jdbc.sql("select id, event_id, title, url, created_at from public.event_doc_links where event_id = :ev order by created_at")
                .param("ev", eventId)
                .query(EventTodoController::docLink)
                .list();
    }

    @PostMapping("/api/admin/events/{eventId}/doc-links")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    DocLink addDocLink(@PathVariable UUID eventId, @Valid @RequestBody NewDocLink body) {
        actor.bind();
        requireEvent(eventId);
        return jdbc.sql("""
                insert into public.event_doc_links (event_id, title, url) values (:ev, :title, :url)
                returning id, event_id, title, url, created_at
                """)
                .param("ev", eventId).param("title", body.title().trim()).param("url", Urls.requireWeb(body.url(), "document link"))
                .query(EventTodoController::docLink)
                .single();
    }

    @DeleteMapping("/api/admin/doc-links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void deleteDocLink(@PathVariable UUID id) {
        actor.bind();
        if (jdbc.sql("delete from public.event_doc_links where id = :id").param("id", id).update() == 0) {
            throw ApiException.notFound("Document link");
        }
    }

    @GetMapping("/api/admin/todos/{id}/comments")
    List<Comment> comments(@PathVariable UUID id) {
        return jdbc.sql("""
                select id, todo_item_id, author_id, author_name, message, created_at
                from public.event_todo_comments where todo_item_id = :id order by created_at
                """)
                .param("id", id)
                .query(EventTodoController::comment)
                .list();
    }

    /** The author is whoever is logged in; the name comes from their profile, not from the request. */
    @PostMapping("/api/admin/todos/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Comment addComment(@PathVariable UUID id, @Valid @RequestBody NewComment body) {
        actor.bind();
        CurrentUser me = Auth.require();
        boolean exists = jdbc.sql("select exists(select 1 from public.event_todo_items where id = :id)")
                .param("id", id).query(Boolean.class).single();
        if (!exists) throw ApiException.notFound("Checklist item");
        return jdbc.sql("""
                insert into public.event_todo_comments (todo_item_id, author_id, author_name, message)
                values (:id, :author, :name, :message)
                returning id, todo_item_id, author_id, author_name, message, created_at
                """)
                .param("id", id).param("author", me.id()).param("name", me.displayName()).param("message", body.message().trim())
                .query(EventTodoController::comment)
                .single();
    }

    private void requireEvent(UUID eventId) {
        boolean exists = jdbc.sql("select exists(select 1 from public.events where id = :id)")
                .param("id", eventId).query(Boolean.class).single();
        if (!exists) throw ApiException.notFound("Event");
    }

    private List<TodoItem> loadItems(UUID eventId) {
        return jdbc.sql("""
                select id, event_id, label, completed, is_default, "order", item_notes, created_at
                from public.event_todo_items where event_id = :ev order by "order"
                """)
                .param("ev", eventId)
                .query(EventTodoController::item)
                .list();
    }

    private static TodoItem item(ResultSet rs, int n) throws SQLException {
        return new TodoItem(rs.getObject("id", UUID.class), rs.getObject("event_id", UUID.class), rs.getString("label"),
                rs.getBoolean("completed"), rs.getBoolean("is_default"), rs.getInt("order"), rs.getString("item_notes"),
                rs.getObject("created_at", OffsetDateTime.class));
    }

    private static Note note(ResultSet rs, int n) throws SQLException {
        return new Note(rs.getObject("id", UUID.class), rs.getObject("event_id", UUID.class), rs.getString("content"),
                rs.getObject("updated_at", OffsetDateTime.class));
    }

    private static DocLink docLink(ResultSet rs, int n) throws SQLException {
        return new DocLink(rs.getObject("id", UUID.class), rs.getObject("event_id", UUID.class), rs.getString("title"),
                rs.getString("url"), rs.getObject("created_at", OffsetDateTime.class));
    }

    private static Comment comment(ResultSet rs, int n) throws SQLException {
        return new Comment(rs.getObject("id", UUID.class), rs.getObject("todo_item_id", UUID.class),
                rs.getObject("author_id", UUID.class), rs.getString("author_name"), rs.getString("message"),
                rs.getObject("created_at", OffsetDateTime.class));
    }
}
