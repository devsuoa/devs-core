package com.devsuoa.api.audit;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * The CMS audit log, for superusers only. Restoring an entry replaces the old browser code
 * that sent raw DELETE/POST/PATCH requests for any table name it was given.
 */
@RestController
public class AuditController {

    public record Entry(UUID id, OffsetDateTime createdAt, String adminName, String adminTeam, UUID authId, String action,
            String targetTable, String targetId, JsonNode targetOld, JsonNode targetNew, String userAgent, String ipAddress,
            String undoOf) {}

    /**
     * Tables whose changes can be reverted, and the column the audit trigger uses as target_id.
     * {@code profiles} is left out on purpose: restoring a profile could hand out admin rights.
     */
    static final Map<String, String> RESTORABLE = Map.of(
            "events", "id",
            "links", "id",
            "tasks", "id",
            "task_comments", "id",
            "events_rsvp", "id",
            "marketing_requests", "id",
            "members", "student_id");

    private static final int MAX_PAGE_SIZE = 5000;

    private final JdbcClient jdbc;
    private final Json json;
    private final ActorContext actor;

    public AuditController(JdbcClient jdbc, Json json, ActorContext actor) {
        this.jdbc = jdbc;
        this.json = json;
        this.actor = actor;
    }

    @GetMapping("/api/admin/audit-log")
    List<Entry> list(@RequestParam(defaultValue = "0") int page, @RequestParam(name = "page_size", defaultValue = "500") int pageSize) {
        int size = Math.clamp(pageSize, 1, MAX_PAGE_SIZE);
        int offset = Math.max(page, 0) * size;
        return jdbc.sql("""
                select id, created_at, admin_name, admin_team, auth_id, action, target_table, target_id,
                       target_old::text as target_old, target_new::text as target_new, user_agent, ip_address, undo_of
                from public.admin_audit_log order by created_at desc limit :size offset :offset
                """)
                .param("size", size).param("offset", offset)
                .query((rs, n) -> new Entry(
                        rs.getObject("id", UUID.class),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getString("admin_name"),
                        rs.getString("admin_team"),
                        rs.getObject("auth_id", UUID.class),
                        rs.getString("action"),
                        rs.getString("target_table"),
                        rs.getString("target_id"),
                        json.parse(rs.getString("target_old")),
                        json.parse(rs.getString("target_new")),
                        rs.getString("user_agent"),
                        rs.getString("ip_address"),
                        rs.getString("undo_of")))
                .list();
    }

    /**
     * Undoes one logged change. Refuses if the row has changed since, so a restore can't
     * silently overwrite later work.
     */
    @PostMapping("/api/admin/audit-log/{id}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void restore(@PathVariable UUID id) {
        actor.bind(id.toString());
        Entry e = find(id).orElseThrow(() -> ApiException.notFound("Audit entry"));
        String pk = RESTORABLE.get(e.targetTable());
        if (pk == null) throw ApiException.badRequest("not_restorable", "Changes to this table can't be restored here.");
        String table = "public." + quote(e.targetTable());
        Set<String> columns = columns(e.targetTable());

        Optional<JsonNode> current = jdbc.sql("select to_jsonb(t)::text from " + table + " t where " + quote(pk) + "::text = :pk")
                .param("pk", e.targetId())
                .query(String.class)
                .optional()
                .map(json::parse);

        switch (e.action().toUpperCase()) {
            case "INSERT", "CREATE" -> {
                requireUnchanged(current, e.targetNew());
                jdbc.sql("delete from " + table + " where " + quote(pk) + "::text = :pk").param("pk", e.targetId()).update();
            }
            case "DELETE" -> {
                if (current.isPresent()) throw ApiException.conflict("row_exists", "That row exists again, so there's nothing to restore.");
                ObjectNode snapshot = only(e.targetOld(), columns);
                String cols = snapshot.propertyNames().stream().map(AuditController::quote).collect(Collectors.joining(", "));
                jdbc.sql("insert into " + table + " (" + cols + ") select " + cols
                                + " from jsonb_populate_record(null::" + table + ", cast(:snap as jsonb))")
                        .param("snap", snapshot.toString())
                        .update();
            }
            case "UPDATE" -> {
                requireUnchanged(current, e.targetNew());
                ObjectNode snapshot = only(e.targetOld(), columns);
                snapshot.remove(pk);
                if (snapshot.isEmpty()) return;
                String cols = snapshot.propertyNames().stream().map(AuditController::quote).collect(Collectors.joining(", "));
                jdbc.sql("update " + table + " set (" + cols + ") = (select " + cols
                                + " from jsonb_populate_record(null::" + table + ", cast(:snap as jsonb))) where "
                                + quote(pk) + "::text = :pk")
                        .param("snap", snapshot.toString())
                        .param("pk", e.targetId())
                        .update();
            }
            default -> throw ApiException.badRequest("not_restorable", "This entry can't be restored.");
        }
    }

    private Optional<Entry> find(UUID id) {
        return jdbc.sql("""
                select id, created_at, admin_name, admin_team, auth_id, action, target_table, target_id,
                       target_old::text as target_old, target_new::text as target_new, user_agent, ip_address, undo_of
                from public.admin_audit_log where id = :id
                """)
                .param("id", id)
                .query((rs, n) -> new Entry(rs.getObject("id", UUID.class), rs.getObject("created_at", OffsetDateTime.class),
                        rs.getString("admin_name"), rs.getString("admin_team"), rs.getObject("auth_id", UUID.class),
                        rs.getString("action"), rs.getString("target_table"), rs.getString("target_id"),
                        json.parse(rs.getString("target_old")), json.parse(rs.getString("target_new")),
                        rs.getString("user_agent"), rs.getString("ip_address"), rs.getString("undo_of")))
                .optional();
    }

    /** The row must still look exactly like it did right after the logged change. */
    private static void requireUnchanged(Optional<JsonNode> current, JsonNode expected) {
        if (current.isEmpty()) throw ApiException.conflict("row_missing", "That row no longer exists.");
        if (expected == null || !expected.isObject()) throw ApiException.badRequest("not_restorable", "This entry can't be restored.");
        for (String key : expected.propertyNames()) {
            if (!expected.get(key).equals(current.get().get(key))) {
                throw ApiException.conflict("changed_since", "That row has changed since this entry. Restore the later entries first.");
            }
        }
    }

    /** Keeps only real columns of the table, so a snapshot can't name anything else. */
    private ObjectNode only(JsonNode snapshot, Set<String> columns) {
        if (snapshot == null || !snapshot.isObject()) throw ApiException.badRequest("not_restorable", "This entry can't be restored.");
        ObjectNode out = json.mapper().createObjectNode();
        for (String key : snapshot.propertyNames()) {
            if (columns.contains(key)) out.set(key, snapshot.get(key));
        }
        return out;
    }

    private Set<String> columns(String table) {
        return new HashSet<>(jdbc.sql("""
                select column_name from information_schema.columns
                where table_schema = 'public' and table_name = :t and is_generated = 'NEVER' and identity_generation is null
                """)
                .param("t", table)
                .query(String.class)
                .list());
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }
}
