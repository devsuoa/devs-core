package com.devsuoa.api.tasks;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.auth.Auth;
import com.devsuoa.api.auth.CurrentUser;
import com.devsuoa.api.auth.ProfileRepository;
import com.devsuoa.api.auth.ProfileRepository.AdminSummary;
import com.devsuoa.api.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
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

/**
 * The exec task tracker. Execs see their own team's tasks; the president and senior advisor
 * see every team's. Any exec can create or edit tasks, as before.
 */
@RestController
public class TaskController {

    static final String TEAM = "president|senior_advisor|admin|marketing|competitions|industry|tech|social";
    static final String STATUS = "todo|doing|review|done";

    public record Task(String id, String name, String label, String assignee, String status, String description,
            String team, int order, boolean archived, LocalDate dueDate, OffsetDateTime createdAt, OffsetDateTime updatedAt) {}

    public record TaskForm(
            @NotBlank @Size(max = 64) @Pattern(regexp = "[A-Za-z0-9_-]+") String id,
            @NotBlank @Size(max = 200) String name,
            @NotNull @Size(max = 100) String label,
            @Size(max = 200) String assignee,
            @NotNull @Pattern(regexp = STATUS) String status,
            @Size(max = 20_000) String description,
            @NotNull @Pattern(regexp = TEAM) String team,
            @NotNull @Min(0) @Max(100_000) Integer order,
            Boolean archived,
            LocalDate dueDate) {}

    public record LaneUpdate(@NotBlank @Size(max = 64) String id, @NotNull @Pattern(regexp = STATUS) String status,
            @NotNull @Min(0) @Max(100_000) Integer order) {}

    public record Lanes(@NotNull @Size(max = 500) List<@Valid @NotNull LaneUpdate> updates) {}

    public record Comment(UUID id, String taskId, UUID authorId, String authorName, String message, OffsetDateTime createdAt) {}

    public record CommentBody(@NotBlank @Size(max = 5000) String message) {}

    private static final String COLUMNS =
            "id, name, label, assignee, status, description, team::text as team, \"order\", archived, due_date, created_at, updated_at";

    private final JdbcClient jdbc;
    private final ActorContext actor;
    private final ProfileRepository profiles;

    public TaskController(JdbcClient jdbc, ActorContext actor, ProfileRepository profiles) {
        this.jdbc = jdbc;
        this.actor = actor;
        this.profiles = profiles;
    }

    @GetMapping("/api/admin/tasks")
    List<Task> tasks() {
        CurrentUser me = Auth.require();
        return jdbc.sql("select " + COLUMNS + " from public.tasks where not archived and (:all or team::text = :team) order by \"order\"")
                .param("all", me.seesAllTeams())
                .param("team", me.team())
                .query(TaskController::task)
                .list();
    }

    @GetMapping("/api/admin/admins")
    List<AdminSummary> admins() {
        return profiles.admins();
    }

    @PostMapping("/api/admin/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Task create(@Valid @RequestBody TaskForm f) {
        actor.bind();
        return jdbc.sql("""
                insert into public.tasks (id, name, label, assignee, status, description, team, "order", archived, due_date)
                values (:id, :name, :label, :assignee, :status, :description, cast(:team as public.team_enum), :order,
                        coalesce(:archived, false), :dueDate)
                returning
                """ + COLUMNS)
                .paramSource(f)
                .query(TaskController::task)
                .single();
    }

    @PutMapping("/api/admin/tasks/{id}")
    @Transactional
    Task update(@PathVariable String id, @Valid @RequestBody TaskForm f) {
        actor.bind();
        if (!id.equals(f.id())) throw ApiException.badRequest("id_mismatch", "The task id in the URL and body differ.");
        return jdbc.sql("""
                update public.tasks set name = :name, label = :label, assignee = :assignee, status = :status,
                    description = :description, team = cast(:team as public.team_enum), "order" = :order,
                    archived = coalesce(:archived, archived), due_date = :dueDate, updated_at = now()
                where id = :id
                returning
                """ + COLUMNS)
                .paramSource(f)
                .query(TaskController::task)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Task"));
    }

    @PostMapping("/api/admin/tasks/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void archive(@PathVariable String id) {
        actor.bind();
        if (jdbc.sql("update public.tasks set archived = true, updated_at = now() where id = :id").param("id", id).update() == 0) {
            throw ApiException.notFound("Task");
        }
    }

    /** Saves a drag-and-drop: new status and position for each moved task, all or nothing. */
    @PutMapping("/api/admin/tasks/lanes")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void lanes(@Valid @RequestBody Lanes body) {
        actor.bind();
        for (LaneUpdate u : body.updates()) {
            jdbc.sql("update public.tasks set status = :status, \"order\" = :order, updated_at = now() where id = :id")
                    .param("status", u.status()).param("order", u.order()).param("id", u.id())
                    .update();
        }
    }

    @GetMapping("/api/admin/tasks/{id}/comments")
    List<Comment> comments(@PathVariable String id) {
        requireVisible(id);
        return jdbc.sql("""
                select id, task_id, author_id, author_name, message, created_at
                from public.task_comments where task_id = :id order by created_at
                """)
                .param("id", id)
                .query(TaskController::comment)
                .list();
    }

    @PostMapping("/api/admin/tasks/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Comment addComment(@PathVariable String id, @Valid @RequestBody CommentBody body) {
        actor.bind();
        requireVisible(id);
        CurrentUser me = Auth.require();
        return jdbc.sql("""
                insert into public.task_comments (task_id, author_id, author_name, message)
                values (:task, :author, :name, :message)
                returning id, task_id, author_id, author_name, message, created_at
                """)
                .param("task", id).param("author", me.id()).param("name", me.displayName()).param("message", body.message().trim())
                .query(TaskController::comment)
                .single();
    }

    /** Only the author can edit their comment. */
    @PatchMapping("/api/admin/task-comments/{id}")
    @Transactional
    Comment editComment(@PathVariable UUID id, @Valid @RequestBody CommentBody body) {
        actor.bind();
        requireAuthor(id, false);
        return jdbc.sql("""
                update public.task_comments set message = :message where id = :id
                returning id, task_id, author_id, author_name, message, created_at
                """)
                .param("message", body.message().trim()).param("id", id)
                .query(TaskController::comment)
                .single();
    }

    /** The author, or a superuser, can delete a comment. */
    @DeleteMapping("/api/admin/task-comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void deleteComment(@PathVariable UUID id) {
        actor.bind();
        requireAuthor(id, true);
        jdbc.sql("delete from public.task_comments where id = :id").param("id", id).update();
    }

    private void requireVisible(String taskId) {
        CurrentUser me = Auth.require();
        boolean visible = jdbc.sql("select exists(select 1 from public.tasks where id = :id and (:all or team::text = :team))")
                .param("id", taskId).param("all", me.seesAllTeams()).param("team", me.team())
                .query(Boolean.class).single();
        if (!visible) throw ApiException.notFound("Task");
    }

    private void requireAuthor(UUID commentId, boolean superuserMayOverride) {
        CurrentUser me = Auth.require();
        UUID author = jdbc.sql("select author_id from public.task_comments where id = :id")
                .param("id", commentId).query(UUID.class).optional()
                .orElseThrow(() -> ApiException.notFound("Comment"));
        boolean allowed = me.id().equals(author) || (superuserMayOverride && me.isSuperuserAdmin());
        if (!allowed) throw ApiException.forbidden("Only the author can change this comment.");
    }

    private static Task task(ResultSet rs, int n) throws SQLException {
        return new Task(rs.getString("id"), rs.getString("name"), rs.getString("label"), rs.getString("assignee"),
                rs.getString("status"), rs.getString("description"), rs.getString("team"), rs.getInt("order"),
                rs.getBoolean("archived"), rs.getObject("due_date", LocalDate.class),
                rs.getObject("created_at", OffsetDateTime.class), rs.getObject("updated_at", OffsetDateTime.class));
    }

    private static Comment comment(ResultSet rs, int n) throws SQLException {
        return new Comment(rs.getObject("id", UUID.class), rs.getString("task_id"), rs.getObject("author_id", UUID.class),
                rs.getString("author_name"), rs.getString("message"), rs.getObject("created_at", OffsetDateTime.class));
    }
}
