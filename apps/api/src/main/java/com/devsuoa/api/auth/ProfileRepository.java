package com.devsuoa.api.auth;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {

    public record Profile(UUID id, String username, String role, String team, boolean superuser) {}

    public record AdminSummary(UUID id, String username) {}

    private final JdbcClient jdbc;

    public ProfileRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<Profile> find(UUID id) {
        return jdbc.sql("""
                select id, username, role, team::text as team, is_superuser
                from public.profiles where id = :id
                """)
                .param("id", id)
                .query((rs, n) -> new Profile(
                        rs.getObject("id", UUID.class),
                        rs.getString("username"),
                        rs.getString("role"),
                        rs.getString("team"),
                        rs.getBoolean("is_superuser")))
                .optional();
    }

    public List<AdminSummary> admins() {
        return jdbc.sql("select id, username from public.profiles where role = 'admin' order by username")
                .query((rs, n) -> new AdminSummary(rs.getObject("id", UUID.class), rs.getString("username")))
                .list();
    }

    /** Makes an invited account an exec. Upserts in case the handle_new_user trigger hasn't run. */
    public void promote(UUID id, String username, String team) {
        jdbc.sql("""
                insert into public.profiles (id, role, username, team)
                values (:id, 'admin', :username, cast(:team as public.team_enum))
                on conflict (id) do update set role = 'admin', username = excluded.username, team = excluded.team
                """)
                .param("id", id)
                .param("username", username)
                .param("team", team)
                .update();
    }
}
