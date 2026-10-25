package com.devsuoa.api.storage;

import com.devsuoa.api.common.ApiException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.springframework.web.multipart.MultipartFile;

/**
 * An uploaded image whose type was decided from its first bytes, not from the file name or
 * the browser's Content-Type, which the uploader controls. SVG is refused: it can carry script.
 */
public record ImageFile(byte[] bytes, String contentType, String extension) {

    public static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static ImageFile from(MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("file_missing", "Choose an image to upload.");
        if (file.getSize() > MAX_BYTES) throw ApiException.badRequest("file_too_large", "Images must be 5 MB or smaller.");
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return of(bytes);
    }

    public static ImageFile of(byte[] b) {
        if (startsWith(b, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) return new ImageFile(b, "image/png", "png");
        if (startsWith(b, 0xFF, 0xD8, 0xFF)) return new ImageFile(b, "image/jpeg", "jpg");
        if (startsWith(b, 'G', 'I', 'F', '8')) return new ImageFile(b, "image/gif", "gif");
        if (b.length >= 12 && startsWith(b, 'R', 'I', 'F', 'F') && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return new ImageFile(b, "image/webp", "webp");
        }
        throw ApiException.badRequest("unsupported_image", "Upload a PNG, JPEG, GIF or WebP image.");
    }

    /** An unguessable file name, so object URLs can't be enumerated. */
    public String randomName() {
        byte[] id = new byte[16];
        RANDOM.nextBytes(id);
        return HexFormat.of().formatHex(id) + "." + extension;
    }

    private static boolean startsWith(byte[] b, int... prefix) {
        if (b.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if ((b[i] & 0xFF) != prefix[i]) return false;
        return true;
    }
}
