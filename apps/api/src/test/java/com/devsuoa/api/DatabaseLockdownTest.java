package com.devsuoa.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

/**
 * Checks the database itself, the way an attacker holding the public anon key would reach it
 * through PostgREST: as the anon or authenticated role. After the migrations, neither can
 * read or write any table, and nobody can promote themselves.
 */
class DatabaseLockdownTest extends IntegrationTest {

    @ParameterizedTest
    @ValueSource(strings = {"members", "student_major", "student_degree", "profiles", "events_rsvp", "admin_audit_log",
            "member_registry", "event_rsvp_pending_payments", "events", "links", "event_todo_comments"})
    void anonCannotReadTables(String table) {
        assertThatThrownBy(() -> asRole("anon", null, "select count(*) from public." + table))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("permission denied");
    }

    @ParameterizedTest
    @ValueSource(strings = {"members", "student_major", "profiles", "events_rsvp", "admin_audit_log"})
    void loggedInUsersCannotReadTablesDirectly(String table) {
        assertThatThrownBy(() -> asRole("authenticated", PLAIN_USER.toString(), "select count(*) from public." + table))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("permission denied");
    }

    @Test
    void nobodyCanPromoteThemselves() {
        assertThatThrownBy(() -> asRole("authenticated", PLAIN_USER.toString(),
                "update public.profiles set role = 'admin', is_superuser = true where id = '" + PLAIN_USER + "'"))
                .isInstanceOf(SQLException.class)
                .hasMessageContaining("permission denied");
        assertThat(sql("select role from public.profiles where id = '" + PLAIN_USER + "'", String.class)).isEqualTo("user");
    }

    @Test
    void apiRoleCannotFlipSuperuser() {
        assertThatThrownBy(() -> {
            try (Connection c = DriverManager.getConnection(jdbcUrl(), "api_app", "api_app");
                    Statement s = c.createStatement()) {
                s.execute("update public.profiles set is_superuser = true where id = '" + ADMIN + "'");
            }
        }).isInstanceOf(SQLException.class).hasMessageContaining("permission denied");
    }

    /** Like a PostgREST request: switch to the role and set the JWT claims Supabase would set. */
    private static void asRole(String role, String sub, String query) throws SQLException {
        try (Connection c = DriverManager.getConnection(jdbcUrl(), "postgres", "postgres")) {
            c.setAutoCommit(false);
            try (Statement s = c.createStatement()) {
                if (sub != null) s.execute("select set_config('request.jwt.claims', '{\"sub\":\"" + sub + "\",\"role\":\"" + role + "\"}', true)");
                s.execute("set local role " + role);
                s.execute(query);
            } finally {
                c.rollback();
            }
        }
    }
}
