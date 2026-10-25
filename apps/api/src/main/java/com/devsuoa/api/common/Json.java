package com.devsuoa.api.common;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.JsonNodeFactory;

/** Reads and writes the jsonb columns (RSVP questions and answers, group emails, audit snapshots). */
@Component
public class Json {

    private final JsonMapper mapper;

    public Json(JsonMapper mapper) {
        this.mapper = mapper;
    }

    public JsonNode parse(String text) {
        if (text == null) return JsonNodeFactory.instance.nullNode();
        return mapper.readTree(text);
    }

    public String write(Object value) {
        return mapper.writeValueAsString(value);
    }

    public JsonMapper mapper() {
        return mapper;
    }
}
