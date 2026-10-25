package com.devsuoa.api.auth;

import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    public record Me(UUID id, String email, String username, String role, String team, boolean isSuperuser) {}

    @GetMapping("/api/health")
    Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/me")
    Me me() {
        CurrentUser u = Auth.require();
        return new Me(u.id(), u.email(), u.username(), u.role(), u.team(), u.superuser());
    }
}
