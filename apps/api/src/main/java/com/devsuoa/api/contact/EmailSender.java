package com.devsuoa.api.contact;

import com.devsuoa.api.config.DevsProperties;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Sends mail through Resend, or only logs it when {@code devs.email.mode=log} (Docker dev, tests). */
@Component
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    private final DevsProperties.Email config;
    private final RestClient http;

    public EmailSender(DevsProperties props, RestClient.Builder builder) {
        this.config = props.email();
        this.http = builder.clone()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + (config.resendApiKey() == null ? "" : config.resendApiKey()))
                .build();
    }

    public void send(String to, String replyTo, String subject, String html) {
        if (!"resend".equals(config.mode())) {
            log.info("Email (not sent, mode={}): to={} subject={}", config.mode(), to, subject);
            return;
        }
        http.post()
                .uri("/emails")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                        "from", config.from(),
                        "to", List.of(to),
                        "reply_to", replyTo,
                        "subject", subject,
                        "html", html))
                .retrieve()
                .toBodilessEntity();
    }
}
