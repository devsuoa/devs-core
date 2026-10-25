package com.devsuoa.api.contact;

import com.devsuoa.api.config.DevsProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

/**
 * The contact and sponsorship forms. The recipient, subject and layout are fixed here; the
 * visitor only supplies their name, email and message, and all three are HTML-escaped.
 */
@RestController
public class ContactController {

    public record Message(
            @NotNull @Pattern(regexp = "contact|sponsor") String kind,
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 5000) String message) {}

    private final EmailSender email;
    private final String recipient;

    public ContactController(EmailSender email, DevsProperties props) {
        this.email = email;
        this.recipient = props.email().contactTo();
    }

    @PostMapping("/api/contact")
    @ResponseStatus(HttpStatus.ACCEPTED)
    void send(@Valid @RequestBody Message m) {
        boolean sponsor = m.kind().equals("sponsor");
        String name = HtmlUtils.htmlEscape(m.name().trim());
        String from = HtmlUtils.htmlEscape(m.email().trim());
        String body = HtmlUtils.htmlEscape(m.message().trim()).replace("\n", "<br>");
        String subject = (sponsor ? "Sponsorship Inquiry from " : "Contact Form Submission from ") + oneLine(m.name());
        String html = """
                <h2>%s</h2>
                <p><strong>%s:</strong> %s</p>
                <p><strong>Email:</strong> %s</p>
                <p><strong>Message:</strong></p>
                <p>%s</p>
                """.formatted(sponsor ? "New Sponsorship Inquiry" : "New Contact Form Submission",
                sponsor ? "Company" : "Name", name, from, body);
        email.send(recipient, m.email().trim(), subject, html);
    }

    /** Subjects are headers: no line breaks, so nothing can be smuggled into the mail headers. */
    private static String oneLine(String s) {
        return s.replaceAll("[\\r\\n\\t]+", " ").trim();
    }
}
