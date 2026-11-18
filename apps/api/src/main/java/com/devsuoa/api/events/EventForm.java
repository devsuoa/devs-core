package com.devsuoa.api.events;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import tools.jackson.databind.JsonNode;

/** An event as an admin creates or edits it. */
public record EventForm(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 10_000) String description,
        @Size(max = 2000) String imageUrl,
        @Size(max = 100) String tag,
        @NotNull LocalDate eventDate,
        @Size(max = 100) String eventTime,
        @Size(max = 300) String location,
        @Size(max = 2000) String registerUrl,
        @NotNull Boolean isActive,
        @Positive @Max(100_000) Integer maxAttendees,
        @NotNull Boolean groupRsvpEnabled,
        @Positive @Max(100) Integer groupRsvpMaxEmails,
        @NotNull Boolean paymentEnabled,
        @DecimalMin("0.00") @DecimalMax("100000.00") @Digits(integer = 6, fraction = 2) BigDecimal chargeAmount,
        @NotNull Boolean bankTransferEnabled,
        JsonNode rsvpQuestions) {

    /** Fills the gaps the old form left to database constraints, with readable errors instead. */
    EventForm normalised(String imageUrl, String registerUrl) {
        return new EventForm(title.trim(), blankToNull(description), imageUrl, blankToNull(tag), eventDate,
                blankToNull(eventTime), blankToNull(location), registerUrl, isActive, maxAttendees, groupRsvpEnabled,
                groupRsvpEnabled ? groupRsvpMaxEmails : null, paymentEnabled, paymentEnabled ? chargeAmount : null,
                paymentEnabled && bankTransferEnabled, rsvpQuestions);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
