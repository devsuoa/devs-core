package com.devsuoa.api.storage;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Admin image uploads for the public buckets. Returns the URL to save on the event or link. */
@RestController
public class UploadController {

    private final BlobStore store;

    public UploadController(BlobStore store) {
        this.store = store;
    }

    @PostMapping(path = "/api/admin/uploads/event-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> eventImage(@RequestPart("file") MultipartFile file) {
        return Map.of("url", upload(BlobStore.EVENT_IMAGES, ImageFile.from(file)));
    }

    @PostMapping(path = "/api/admin/uploads/link-icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> linkIcon(@RequestPart("file") MultipartFile file) {
        return Map.of("url", upload(BlobStore.LINK_ICONS, ImageFile.from(file)));
    }

    private String upload(String bucket, ImageFile image) {
        String path = image.randomName();
        store.put(bucket, path, image.bytes(), image.contentType());
        return store.publicUrl(bucket, path);
    }
}
