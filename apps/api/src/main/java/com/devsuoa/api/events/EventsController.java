package com.devsuoa.api.events;

import com.devsuoa.api.auth.ActorContext;
import com.devsuoa.api.common.ApiException;
import com.devsuoa.api.common.Json;
import com.devsuoa.api.common.Urls;
import com.devsuoa.api.events.EventRepository.Event;
import com.devsuoa.api.events.EventRepository.PublicEvent;
import com.devsuoa.api.rsvp.RsvpQuestions;
import com.devsuoa.api.storage.BlobStore;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EventsController {

    private static final Logger log = LoggerFactory.getLogger(EventsController.class);

    private final EventRepository events;
    private final ActorContext actor;
    private final BlobStore store;
    private final Json json;
    private final TransactionTemplate tx;

    public EventsController(EventRepository events, ActorContext actor, BlobStore store, Json json, TransactionTemplate tx) {
        this.events = events;
        this.actor = actor;
        this.store = store;
        this.json = json;
        this.tx = tx;
    }

    /** Active events, oldest first. The site splits them into upcoming and past. */
    @GetMapping("/api/events")
    List<PublicEvent> publicEvents() {
        return events.active().stream().map(PublicEvent::of).toList();
    }

    @GetMapping("/api/admin/events")
    List<Event> all() {
        return events.all();
    }

    @PostMapping("/api/admin/events")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    Event create(@Valid @RequestBody EventForm form) {
        actor.bind();
        EventForm f = check(form);
        return events.insert(f, questionsJson(f));
    }

    @PutMapping("/api/admin/events/{id}")
    @Transactional
    Event update(@PathVariable UUID id, @Valid @RequestBody EventForm form) {
        actor.bind();
        EventForm f = check(form);
        if (!events.update(id, f, questionsJson(f))) throw ApiException.notFound("Event");
        return events.find(id).orElseThrow();
    }

    @DeleteMapping("/api/admin/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable UUID id) {
        Event event = events.find(id).orElseThrow(() -> ApiException.notFound("Event"));
        tx.executeWithoutResult(s -> {
            actor.bind();
            if (!events.delete(id)) throw ApiException.notFound("Event");
        });
        // The row is gone; failing to tidy up the image shouldn't fail the request.
        store.pathFromPublicUrl(BlobStore.EVENT_IMAGES, event.imageUrl()).ifPresent(path -> {
            try {
                store.delete(BlobStore.EVENT_IMAGES, path);
            } catch (RuntimeException e) {
                log.warn("Could not delete image {} for event {}", path, id, e);
            }
        });
    }

    private EventForm check(EventForm form) {
        String image = Urls.requireWeb(form.imageUrl(), "image URL");
        String register = Urls.requireWeb(form.registerUrl(), "registration link");
        EventForm f = form.normalised(image, register);
        if (f.groupRsvpEnabled() && f.groupRsvpMaxEmails() == null) {
            throw ApiException.badRequest("group_size_required", "Set the largest group size allowed.");
        }
        if (f.paymentEnabled() && (f.chargeAmount() == null || f.chargeAmount().signum() <= 0)) {
            throw ApiException.badRequest("charge_required", "Set the price for a paid event.");
        }
        return f;
    }

    private String questionsJson(EventForm f) {
        return json.write(RsvpQuestions.toJson(RsvpQuestions.parse(f.rsvpQuestions())));
    }
}
