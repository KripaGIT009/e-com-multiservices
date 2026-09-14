package com.example.entity;

import java.util.Locale;
import java.util.Optional;

/**
 * Who owns the stock and ships an item (docs/commerce-architecture.md §3).
 *
 * <p>Stored on {@link Item} as a plain varchar, not {@code @Enumerated}: Hibernate 6
 * emits a CHECK constraint for enum columns that {@code ddl-auto: update} can never
 * widen, so adding a value later would break every existing database.
 */
public enum FulfilmentModel {
    FIRST_PARTY,
    SELLER,
    DROPSHIP;

    /** Parses a stored or requested value; empty for null, blank or unknown input. */
    public static Optional<FulfilmentModel> parse(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(value.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
