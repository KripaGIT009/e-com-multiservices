package com.example.carrier.http;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/** Reading the loosely-typed JSON carriers send back, without trusting its shape. */
public final class CarrierJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_MESSAGE = 300;
    private static final String[] ERROR_FIELDS =
        {"message", "detail", "error", "Error", "rmk", "remark", "remarks", "errors"};

    private CarrierJson() {
    }

    public static String toJson(Object value) {
        try {
            return MAPPER.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialise a carrier request", e);
        }
    }

    public static JsonNode parse(String body) {
        try {
            return MAPPER.readTree(body);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    /** The node at a path of field names, or null when any step is missing. */
    public static JsonNode at(JsonNode node, String... path) {
        JsonNode current = node;
        for (String field : path) {
            if (current == null || current.isNull() || current.isMissingNode()) return null;
            current = current.get(field);
        }
        return current == null || current.isNull() || current.isMissingNode() ? null : current;
    }

    /** Text at a path; null when missing or blank. Numbers come back as their text. */
    public static String text(JsonNode node, String... path) {
        JsonNode value = at(node, path);
        if (value == null || value.isContainerNode()) return null;
        String text = value.asText();
        return text.isBlank() ? null : text.trim();
    }

    /** First element of an array at a path, or null. */
    public static JsonNode first(JsonNode node, String... path) {
        JsonNode array = at(node, path);
        return array != null && array.isArray() && !array.isEmpty() ? array.get(0) : null;
    }

    /** Every scalar under a node, joined with "; " — for remark arrays and error maps. */
    public static String join(JsonNode node) {
        if (node == null || node.isNull()) return null;
        List<String> parts = new ArrayList<>();
        collect(node, parts);
        return parts.isEmpty() ? null : String.join("; ", parts);
    }

    private static void collect(JsonNode node, List<String> parts) {
        if (node.isArray()) {
            node.forEach(child -> collect(child, parts));
        } else if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String inner = join(field.getValue());
                if (inner != null) parts.add(field.getKey() + ": " + inner);
            }
        } else if (!node.isNull() && !node.asText().isBlank()) {
            parts.add(node.asText().trim());
        }
    }

    /**
     * The carrier's explanation from an error body: its message-like fields when the body
     * is JSON, otherwise the body itself, shortened.
     */
    public static String errorText(String body) {
        if (body == null || body.isBlank()) return "no error detail was returned";
        JsonNode json = parse(body);
        if (json != null && json.isObject()) {
            List<String> parts = new ArrayList<>();
            for (String field : ERROR_FIELDS) {
                String value = join(json.get(field));
                if (value != null && !parts.contains(value)) parts.add(value);
            }
            if (!parts.isEmpty()) return truncate(String.join("; ", parts));
        }
        return truncate(body.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim());
    }

    public static String truncate(String text) {
        if (text == null) return null;
        return text.length() <= MAX_MESSAGE ? text : text.substring(0, MAX_MESSAGE) + "…";
    }

    /**
     * Carrier timestamps in whatever ISO-like form they arrive: with or without an offset,
     * 'T' or a space, fractional seconds or none. Null when it cannot be read.
     */
    public static LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        String text = value.trim();
        try {
            return OffsetDateTime.parse(text).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // no offset — try a local form
        }
        try {
            return LocalDateTime.parse(text.replace(' ', 'T'));
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }
}
