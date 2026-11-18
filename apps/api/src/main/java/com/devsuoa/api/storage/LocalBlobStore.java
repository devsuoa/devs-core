package com.devsuoa.api.storage;

import com.devsuoa.api.config.DevsProperties;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Stores files in a folder. For Docker dev only, so nobody needs Supabase Storage keys locally. */
@Component
@ConditionalOnProperty(name = "devs.storage.mode", havingValue = "local")
public class LocalBlobStore implements BlobStore {

    private final Path root;
    private final String publicBase;

    public LocalBlobStore(DevsProperties props) {
        this.root = Path.of(props.storage().localDir()).toAbsolutePath().normalize();
        String base = props.storage().publicBaseUrl();
        this.publicBase = (base == null || base.isBlank() ? "http://localhost:8080" : base).replaceAll("/+$", "");
    }

    @Override
    public void put(String bucket, String path, byte[] bytes, String contentType) {
        Path file = resolve(bucket, path);
        try {
            Files.createDirectories(file.getParent());
            Files.write(file, bytes);
            Files.writeString(file.resolveSibling(file.getFileName() + ".type"), contentType);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public Optional<Blob> get(String bucket, String path) {
        Path file = resolve(bucket, path);
        if (!Files.isRegularFile(file)) return Optional.empty();
        try {
            Path typeFile = file.resolveSibling(file.getFileName() + ".type");
            String type = Files.exists(typeFile) ? Files.readString(typeFile) : "application/octet-stream";
            return Optional.of(new Blob(Files.readAllBytes(file), type));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public void delete(String bucket, String path) {
        Path file = resolve(bucket, path);
        try {
            Files.deleteIfExists(file);
            Files.deleteIfExists(file.resolveSibling(file.getFileName() + ".type"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @Override
    public String publicUrl(String bucket, String path) {
        return publicBase + "/api/files/public/" + bucket + "/" + path;
    }

    private Path resolve(String bucket, String path) {
        Path file = root.resolve(bucket).resolve(SupabaseBlobStore.safe(path)).normalize();
        if (!file.startsWith(root.resolve(bucket))) throw new IllegalArgumentException("Unsafe storage path");
        return file;
    }
}
