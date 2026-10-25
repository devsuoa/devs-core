package com.devsuoa.api.links;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Urls;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The links page (link-in-bio style list) and its admin editor. */
@RestController
public class LinksController {

    public record Link(
            UUID id,
            String title,
            String url,
            boolean isActive,
            OffsetDateTime activeFrom,
            OffsetDateTime activeTo,
            int displayOrder,
            boolean isSpacer,
            String customIcon,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {

        /** Same rule the site used client-side: spacers follow is_active; links also need to be inside their date window. */
        boolean visibleAt(OffsetDateTime now) {
            if (!isActive) return false;
            if (isSpacer) return true;
            if (activeFrom != null && now.isBefore(activeFrom)) return false;
            return activeTo == null || !now.isAfter(activeTo);
        }
    }

    public record LinkForm(
            @NotNull @Size(max = 200) String title,
            @Size(max = 2000) String url,
            @NotNull Boolean isActive,
            @Size(max = 40) String activeFrom,
            @Size(max = 40) String activeTo,
            @Min(0) @Max(100_000) Integer displayOrder,
            Boolean isSpacer,
            @Size(max = 2000) String customIcon) {}

    public record Order(@NotNull @Size(max = 500) List<UUID> ids) {}

    private static final Set<String> LINK_SCHEMES = Set.of("http", "https", "mailto");
    private static final String COLUMNS =
            "id, title, url, coalesce(is_active, false) as is_active, active_from, active_to, display_order, is_spacer, custom_icon, created_at, updated_at";

    private final JdbcClient jdbc;
    private final ActorContext actor;

    public LinksController(JdbcClient jdbc, ActorContext actor) {
        this.jdbc = jdbc;
        this.actor = actor;
    }

    @GetMapping("/api/links")
    List<Link> visible() {
        OffsetDateTime now = OffsetDateTime.now();
        return all().stream().filter(l -> l.visibleAt(now)).toList();
    }

    @GetMapping("/api/admin/links")
    List<Link> all() {
        return jdbc.sql("select " + COLUMNS + " from public.links order by display_order asc, created_at desc")
                .query(LinksController::map)
                .list();
    }

    @PostMapping("/api/admin/links")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Link create(@Valid @RequestBody LinkForm form) {
        actor.bind();
        Checked c = check(form);
        Integer order = form.displayOrder() != null ? form.displayOrder()
                : jdbc.sql("select coalesce(max(display_order) + 1, 0) from public.links").query(Integer.class).single();
        return jdbc.sql("""
                insert into public.links (title, url, is_active, active_from, active_to, display_order, is_spacer, custom_icon)
                values (:title, :url, :active, cast(:from as timestamptz), cast(:to as timestamptz), :order, :spacer, :icon)
                returning
                """ + COLUMNS)
                .param("title", c.title).param("url", c.url).param("active", form.isActive())
                .param("from", c.from).param("to", c.to).param("order", order)
                .param("spacer", c.spacer).param("icon", c.icon)
                .query(LinksController::map)
                .single();
    }

    @PutMapping("/api/admin/links/{id}")
    @Transactional
    Link update(@PathVariable UUID id, @Valid @RequestBody LinkForm form) {
        actor.bind();
        Checked c = check(form);
        return jdbc.sql("""
                update public.links set title = :title, url = :url, is_active = :active,
                    active_from = cast(:from as timestamptz), active_to = cast(:to as timestamptz),
                    display_order = coalesce(:order, display_order), is_spacer = :spacer, custom_icon = :icon
                where id = :id
                returning
                """ + COLUMNS)
                .param("title", c.title).param("url", c.url).param("active", form.isActive())
                .param("from", c.from).param("to", c.to).param("order", form.displayOrder())
                .param("spacer", c.spacer).param("icon", c.icon).param("id", id)
                .query(LinksController::map)
                .optional()
                .orElseThrow(() -> ApiException.notFound("Link"));
    }

    @DeleteMapping("/api/admin/links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void delete(@PathVariable UUID id) {
        actor.bind();
        if (jdbc.sql("delete from public.links where id = :id").param("id", id).update() == 0) throw ApiException.notFound("Link");
    }

    /** Saves a new order in one transaction: display_order becomes each link's position in {@code ids}. */
    @PutMapping("/api/admin/links/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    void reorder(@Valid @RequestBody Order order) {
        actor.bind();
        if (new HashSet<>(order.ids()).size() != order.ids().size()) throw ApiException.badRequest("duplicate_ids", "Each link can appear once.");
        for (int i = 0; i < order.ids().size(); i++) {
            jdbc.sql("update public.links set display_order = :i where id = :id and display_order is distinct from :i")
                    .param("i", i).param("id", order.ids().get(i))
                    .update();
        }
    }

    private record Checked(String title, String url, String from, String to, boolean spacer, String icon) {}

    private static Checked check(LinkForm f) {
        boolean spacer = Boolean.TRUE.equals(f.isSpacer());
        String url = spacer && (f.url() == null || f.url().isBlank()) ? "" : Urls.requireScheme(f.url(), "link", LINK_SCHEMES);
        if (url == null) throw ApiException.badRequest("url_required", "Enter the link's address.");
        if (!spacer && f.title().isBlank()) throw ApiException.badRequest("title_required", "Give the link a title.");
        return new Checked(f.title().trim(), url, timestamp(f.activeFrom()), timestamp(f.activeTo()), spacer,
                Urls.requireWeb(f.customIcon(), "icon URL"));
    }

    /** Accepts what the admin form sends: an ISO timestamp, with or without a zone. */
    private static String timestamp(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            OffsetDateTime.parse(s);
            return s;
        } catch (DateTimeParseException e) {
            try {
                LocalDateTime.parse(s);
                return s;
            } catch (DateTimeParseException e2) {
                throw ApiException.badRequest("invalid_date", "Dates must look like 2026-10-26T09:00.");
            }
        }
    }

    private static Link map(ResultSet rs, int row) throws SQLException {
        return new Link(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("url"),
                rs.getBoolean("is_active"),
                rs.getObject("active_from", OffsetDateTime.class),
                rs.getObject("active_to", OffsetDateTime.class),
                rs.getInt("display_order"),
                rs.getBoolean("is_spacer"),
                rs.getString("custom_icon"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class));
    }
}
