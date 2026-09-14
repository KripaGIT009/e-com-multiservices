package com.example.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * Who ships a group of order lines (docs/commerce-architecture.md §3).
 *
 * Stored as a varchar, never with @Enumerated: Hibernate 6 emits a CHECK constraint for
 * an enum column that ddl-auto update never widens, so adding a value later would fail
 * on every existing database until Flyway lands (ADR-0003).
 */
public enum FulfilmentModel {
    FIRST_PARTY,
    SELLER,
    DROPSHIP;

    /** Case-insensitive lookup; empty for null, blank or unknown input. */
    public static Optional<FulfilmentModel> parse(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        String wanted = value.trim().toUpperCase();
        return Arrays.stream(values()).filter(m -> m.name().equals(wanted)).findFirst();
    }
}
