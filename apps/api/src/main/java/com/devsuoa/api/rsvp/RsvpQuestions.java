package com.devsuoa.api.rsvp;

import com.devsuoa.api.common.ApiException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

/**
 * The custom questions an event asks on RSVP ({@code events.rsvp_questions}), and checks on
 * the answers people send back. Matches {@code src/lib/eventRsvpTypes.ts}.
 */
public final class RsvpQuestions {

    public record Question(String id, String prompt, String type, boolean required, List<String> options) {}

    private static final Set<String> TYPES = Set.of("text", "single_select", "multi_select");
    private static final int MAX_QUESTIONS = 30;
    private static final int MAX_OPTIONS = 50;
    private static final int MAX_TEXT_ANSWER = 2000;

    private RsvpQuestions() {}

    /** Parses and checks questions an admin saves on an event. */
    public static List<Question> parse(JsonNode node) {
        if (node == null || node.isNull()) return List.of();
        if (!node.isArray()) throw invalidQuestions();
        if (node.size() > MAX_QUESTIONS) throw ApiException.badRequest("invalid_questions", "An event can have at most 30 RSVP questions.");
        List<Question> out = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        for (JsonNode q : node) {
            if (!q.isObject()) throw invalidQuestions();
            String id = text(q, "id", 100);
            String prompt = text(q, "prompt", 500);
            String type = text(q, "type", 20);
            if (id.isBlank() || prompt.isBlank() || !TYPES.contains(type) || !ids.add(id)) throw invalidQuestions();
            List<String> options = new ArrayList<>();
            JsonNode opts = q.path("options");
            if (opts.isArray()) {
                if (opts.size() > MAX_OPTIONS) throw invalidQuestions();
                for (JsonNode o : opts) {
                    if (!o.isString() || o.asString().length() > 200) throw invalidQuestions();
                    options.add(o.asString());
                }
            }
            if (!type.equals("text") && options.isEmpty()) throw invalidQuestions();
            out.add(new Question(id, prompt, type, q.path("required").asBoolean(false), options));
        }
        return out;
    }

    /** Questions as stored JSON, with only the known fields. */
    public static ArrayNode toJson(List<Question> questions) {
        ArrayNode arr = JsonNodeFactory.instance.arrayNode();
        for (Question q : questions) {
            ObjectNode o = arr.addObject();
            o.put("id", q.id());
            o.put("prompt", q.prompt());
            o.put("type", q.type());
            o.put("required", q.required());
            ArrayNode opts = o.putArray("options");
            q.options().forEach(opts::add);
        }
        return arr;
    }

    /**
     * Checks answers against the event's questions: unknown questions are dropped, required
     * ones must be answered, and select answers must be one of the offered options.
     */
    public static ObjectNode validateAnswers(List<Question> questions, Map<String, Object> answers) {
        ObjectNode out = JsonNodeFactory.instance.objectNode();
        Map<String, Object> given = answers == null ? Map.of() : answers;
        for (Question q : questions) {
            Object a = given.get(q.id());
            switch (q.type()) {
                case "text" -> {
                    String s = a instanceof String str ? str.trim() : "";
                    if (s.length() > MAX_TEXT_ANSWER) throw invalidAnswer(q);
                    if (s.isEmpty()) {
                        if (q.required()) throw missingAnswer(q);
                    } else {
                        out.put(q.id(), s);
                    }
                }
                case "single_select" -> {
                    String s = a instanceof String str ? str : "";
                    if (s.isEmpty()) {
                        if (q.required()) throw missingAnswer(q);
                    } else {
                        if (!q.options().contains(s)) throw invalidAnswer(q);
                        out.put(q.id(), s);
                    }
                }
                case "multi_select" -> {
                    Set<String> picked = new LinkedHashSet<>();
                    if (a instanceof List<?> list) {
                        for (Object o : list) {
                            if (!(o instanceof String s) || !q.options().contains(s)) throw invalidAnswer(q);
                            picked.add(s);
                        }
                    } else if (a != null) {
                        throw invalidAnswer(q);
                    }
                    if (picked.isEmpty()) {
                        if (q.required()) throw missingAnswer(q);
                    } else {
                        ArrayNode arr = out.putArray(q.id());
                        picked.forEach(arr::add);
                    }
                }
                default -> throw invalidAnswer(q);
            }
        }
        return out;
    }

    private static String text(JsonNode q, String field, int max) {
        JsonNode v = q.path(field);
        if (!v.isString() || v.asString().length() > max) throw invalidQuestions();
        return v.asString().trim();
    }

    private static ApiException invalidQuestions() {
        return ApiException.badRequest("invalid_questions", "The RSVP questions are not valid.");
    }

    private static ApiException missingAnswer(Question q) {
        return ApiException.badRequest("answer_required", "Please answer: " + q.prompt());
    }

    private static ApiException invalidAnswer(Question q) {
        return ApiException.badRequest("invalid_answer", "That answer isn't valid for: " + q.prompt());
    }
}
