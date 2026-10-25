package com.devsuoa.api.payments;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Checks the {@code Stripe-Signature} header: HMAC-SHA256 of {@code "<t>.<raw body>"} with the
 * endpoint's signing secret, compared in constant time, and a timestamp within five minutes so
 * a captured request can't be replayed later.
 * See https://docs.stripe.com/webhooks#verify-manually.
 */
public final class StripeSignature {

    static final long TOLERANCE_SECONDS = 300;

    private StripeSignature() {}

    public static boolean isValid(String payload, String header, String secret, Instant now) {
        if (payload == null || header == null || secret == null || secret.isBlank()) return false;
        Long timestamp = null;
        java.util.List<String> signatures = new java.util.ArrayList<>();
        for (String part : header.split(",")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length != 2) continue;
            if (kv[0].equals("t")) {
                try {
                    timestamp = Long.parseLong(kv[1]);
                } catch (NumberFormatException e) {
                    return false;
                }
            } else if (kv[0].equals("v1")) {
                signatures.add(kv[1]);
            }
        }
        if (timestamp == null || signatures.isEmpty()) return false;
        if (Math.abs(now.getEpochSecond() - timestamp) > TOLERANCE_SECONDS) return false;

        byte[] expected = hmac(secret, timestamp + "." + payload);
        for (String sig : signatures) {
            byte[] given;
            try {
                given = HexFormat.of().parseHex(sig);
            } catch (IllegalArgumentException e) {
                continue;
            }
            if (MessageDigest.isEqual(expected, given)) return true;
        }
        return false;
    }

    static byte[] hmac(String secret, String message) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException(e);
        }
    }
}
