package com.devsuoa.api.config;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Settings under {@code devs.*} in application.yml. */
@ConfigurationProperties("devs")
public record DevsProperties(
        String siteUrl,
        List<String> corsAllowedOrigins,
        Schema schema,
        Supabase supabase,
        Storage storage,
        Email email,
        Stripe stripe,
        Marketing marketing,
        RateLimit rateLimit) {

    public record Schema(String requiredVersion, boolean checkOnStartup) {}

    public record Supabase(String url, String jwtSecret, String serviceRoleKey) {}

    public record Storage(String mode, String localDir, String publicBaseUrl) {}

    public record Email(String mode, String resendApiKey, String from, String contactTo) {}

    public record Stripe(String secretKey, String webhookSecret, BigDecimal cardFeePercent, BigDecimal cardFeeFixed) {}

    public record Marketing(String appsScriptUrl) {}

    public record RateLimit(int publicWritesPerMinute) {}
}
