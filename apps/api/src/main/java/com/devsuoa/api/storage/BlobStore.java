package com.devsuoa.api.storage;

import java.util.Optional;

/** File storage. Supabase Storage when deployed, a local folder in Docker dev. */
public interface BlobStore {

    /** Public bucket: event cover images, readable by anyone through {@link #publicUrl}. */
    String EVENT_IMAGES = "event-images";
    /** Public bucket: custom icons on the links page. */
    String LINK_ICONS = "Links";
    /** Private bucket: bank transfer screenshots. Only the API reads it, for admins. */
    String PAYMENT_PROOFS = "event-payments";

    record Blob(byte[] bytes, String contentType) {}

    void put(String bucket, String path, byte[] bytes, String contentType);

    Optional<Blob> get(String bucket, String path);

    void delete(String bucket, String path);

    String publicUrl(String bucket, String path);

    /** The object path if {@code url} points into {@code bucket} of this store, else empty. */
    default Optional<String> pathFromPublicUrl(String bucket, String url) {
        if (url == null) return Optional.empty();
        String prefix = publicUrl(bucket, "");
        if (!url.startsWith(prefix)) return Optional.empty();
        String path = url.substring(prefix.length());
        return path.isBlank() || path.contains("..") ? Optional.empty() : Optional.of(path);
    }
}
