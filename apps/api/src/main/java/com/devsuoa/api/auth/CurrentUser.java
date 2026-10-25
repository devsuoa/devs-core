package com.devsuoa.api.auth;

import java.util.UUID;

/**
 * The logged-in person, as the database sees them. Roles come from {@code public.profiles},
 * which clients can no longer write to, never from claims inside the JWT.
 */
public record CurrentUser(UUID id, String email, String username, String role, String team, boolean superuser) {

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_SUPERUSER = "ROLE_SUPERUSER";

    /** Teams whose members see every team's tasks. Mirrors the old RLS policy. */
    public static final java.util.Set<String> GLOBAL_TEAMS = java.util.Set.of("president", "senior_advisor");

    public boolean isAdmin() {
        return "admin".equals(role);
    }

    public boolean isSuperuserAdmin() {
        return isAdmin() && superuser;
    }

    public boolean seesAllTeams() {
        return team != null && GLOBAL_TEAMS.contains(team);
    }

    public String displayName() {
        if (username != null && !username.isBlank()) return username;
        if (email != null && !email.isBlank()) return email;
        return "Unknown";
    }
}
