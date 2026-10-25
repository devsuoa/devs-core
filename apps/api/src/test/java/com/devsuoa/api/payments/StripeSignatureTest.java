package com.devsuoa.api.payments;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.HexFormat;
import org.junit.jupiter.api.Test;

class StripeSignatureTest {

    static final String SECRET = "whsec_test";
    static final String BODY = "{\"type\":\"checkout.session.completed\"}";

    static String header(long t, String body, String secret) {
        return "t=" + t + ",v1=" + HexFormat.of().formatHex(StripeSignature.hmac(secret, t + "." + body));
    }

    @Test
    void acceptsAFreshCorrectSignature() {
        Instant now = Instant.now();
        assertThat(StripeSignature.isValid(BODY, header(now.getEpochSecond(), BODY, SECRET), SECRET, now)).isTrue();
    }

    @Test
    void rejectsTamperingWrongSecretsAndReplays() {
        Instant now = Instant.now();
        long t = now.getEpochSecond();
        assertThat(StripeSignature.isValid(BODY + " ", header(t, BODY, SECRET), SECRET, now)).isFalse();
        assertThat(StripeSignature.isValid(BODY, header(t, BODY, "whsec_other"), SECRET, now)).isFalse();
        assertThat(StripeSignature.isValid(BODY, header(t - 600, BODY, SECRET), SECRET, now)).isFalse();
        assertThat(StripeSignature.isValid(BODY, "t=" + t, SECRET, now)).isFalse();
        assertThat(StripeSignature.isValid(BODY, null, SECRET, now)).isFalse();
        assertThat(StripeSignature.isValid(BODY, header(t, BODY, SECRET), "", now)).isFalse();
    }
}
