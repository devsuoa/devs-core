package com.devsuoa.api.rsvp;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

/** What a visitor sends to RSVP. Payment fields are deliberately absent: the server sets them. */
public record RsvpRequest(
        @NotBlank @Email @Size(max = 254) String leaderEmail,
        @NotNull @Size(max = 100) List<@NotBlank @Email @Size(max = 254) String> groupEmails,
        @Size(max = 500) String dietaryRequirements,
        @Size(max = 30) Map<String, Object> answers) {}
