package com.devsuoa.api.users;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.auth.ProfileRepository;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.config.DevsProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

/**
 * Exec accounts are created by invitation from a superuser. This replaces public sign-up,
 * which let anyone create an account and then promote it to admin.
 */
@RestController
public class InviteController {

    public record Invite(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 100) String username,
            @NotNull @Pattern(regexp = "president|senior_advisor|admin|marketing|competitions|industry|tech|social") String team) {}

    public record Invited(UUID id, String email) {}

    private final RestClient auth;
    private final ProfileRepository profiles;
    private final ActorContext actor;
    private final TransactionTemplate tx;
    private final String siteUrl;

    public InviteController(DevsProperties props, RestClient.Builder builder, ProfileRepository profiles, ActorContext actor,
            TransactionTemplate tx) {
        String key = props.supabase().serviceRoleKey() == null ? "" : props.supabase().serviceRoleKey();
        this.auth = builder.clone()
                .baseUrl(props.supabase().url().replaceAll("/+$", "") + "/auth/v1")
                .defaultHeader("Authorization", "Bearer " + key)
                .defaultHeader("apikey", key)
                .build();
        this.profiles = profiles;
        this.actor = actor;
        this.tx = tx;
        this.siteUrl = props.siteUrl().replaceAll("/+$", "");
    }

    @PostMapping("/api/admin/users/invite")
    @ResponseStatus(HttpStatus.CREATED)
    Invited invite(@Valid @RequestBody Invite body) {
        String email = body.email().trim().toLowerCase(Locale.ROOT);
        JsonNode user;
        try {
            user = auth.post()
                    .uri(u -> u.path("/invite").queryParam("redirect_to", siteUrl + "/admin/reset-password").build())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email, "data", Map.of("username", body.username().trim())))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode().value() == 422) throw ApiException.conflict("already_registered", "That email already has an account.");
            throw e;
        }
        UUID id = UUID.fromString(user.path("id").asString());
        // The handle_new_user trigger created the profile as a plain user; make it an exec.
        tx.executeWithoutResult(s -> {
            actor.bind();
            profiles.promote(id, body.username().trim(), body.team());
        });
        return new Invited(id, email);
    }
}
