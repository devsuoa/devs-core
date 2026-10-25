package com.devsuoa.api.storage;

import com.devsuoa.api.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Serves the public buckets when storage is a local folder, standing in for Supabase's
 * public object URLs. The payment proofs bucket is deliberately not servable here.
 */
@RestController
@ConditionalOnProperty(name = "devs.storage.mode", havingValue = "local")
public class LocalFilesController {

    private static final Set<String> PUBLIC_BUCKETS = Set.of(BlobStore.EVENT_IMAGES, BlobStore.LINK_ICONS);
    private final BlobStore store;

    public LocalFilesController(BlobStore store) {
        this.store = store;
    }

    @GetMapping("/api/files/public/{bucket}/**")
    ResponseEntity<byte[]> file(@PathVariable String bucket, HttpServletRequest request) {
        if (!PUBLIC_BUCKETS.contains(bucket)) throw ApiException.notFound("File");
        String prefix = "/api/files/public/" + bucket + "/";
        String path = request.getRequestURI().substring(prefix.length());
        BlobStore.Blob blob = store.get(bucket, path).orElseThrow(() -> ApiException.notFound("File"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(blob.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(blob.bytes());
    }
}
