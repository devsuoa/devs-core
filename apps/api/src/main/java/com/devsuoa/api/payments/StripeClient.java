package com.devsuoa.api.payments;

import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.config.DevsProperties;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

/** The two Stripe calls the API needs, over Stripe's REST API. */
@Component
public class StripeClient {

    public record CheckoutRequest(
            UUID pendingPaymentId, UUID eventId, String customerEmail, String description, long amountCents,
            String successUrl, String cancelUrl) {}

    public record Session(String id, String url) {}

    private final RestClient http;
    private final boolean configured;

    public StripeClient(DevsProperties props, RestClient.Builder builder) {
        String key = props.stripe().secretKey();
        this.configured = key != null && !key.isBlank();
        this.http = builder.clone()
                .baseUrl("https://api.stripe.com/v1")
                .defaultHeader("Authorization", "Bearer " + (configured ? key : "unset"))
                .build();
    }

    public Session createCheckoutSession(CheckoutRequest r) {
        if (!configured) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "payments_unavailable", "Card payments aren't set up yet.");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("mode", "payment");
        form.add("success_url", r.successUrl());
        form.add("cancel_url", r.cancelUrl());
        form.add("customer_email", r.customerEmail());
        form.add("client_reference_id", r.pendingPaymentId().toString());
        form.add("metadata[pending_payment_id]", r.pendingPaymentId().toString());
        form.add("metadata[event_id]", r.eventId().toString());
        form.add("line_items[0][quantity]", "1");
        form.add("line_items[0][price_data][currency]", "nzd");
        form.add("line_items[0][price_data][unit_amount]", Long.toString(r.amountCents()));
        form.add("line_items[0][price_data][product_data][name]", r.description());
        // Stripe's minimum. An abandoned session expires and its pending row is marked failed.
        form.add("expires_at", Long.toString(Instant.now().plusSeconds(31 * 60).getEpochSecond()));

        JsonNode body = http.post()
                .uri("/checkout/sessions")
                .header("Idempotency-Key", r.pendingPaymentId().toString())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(JsonNode.class);
        return new Session(body.path("id").asString(), body.path("url").asString());
    }
}
