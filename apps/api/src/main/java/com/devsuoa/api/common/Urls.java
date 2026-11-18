package com.devsuoa.api.common;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/** URL checks for anything an admin can type that later ends up in an href or img src. */
public final class Urls {

    private Urls() {}

    /** Throws unless {@code value} is null/blank or an absolute URL with one of {@code schemes}. */
    public static String requireScheme(String value, String field, Set<String> schemes) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        try {
            URI uri = new URI(trimmed);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if (!schemes.contains(scheme)) throw invalid(field);
            if ((scheme.equals("http") || scheme.equals("https")) && (uri.getHost() == null || uri.getHost().isBlank())) {
                throw invalid(field);
            }
            return trimmed;
        } catch (java.net.URISyntaxException e) {
            throw invalid(field);
        }
    }

    public static String requireWeb(String value, String field) {
        return requireScheme(value, field, Set.of("http", "https"));
    }

    private static ApiException invalid(String field) {
        return ApiException.badRequest("invalid_url", "The " + field + " must be a full web address.");
    }
}
