package com.example.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * How a courier is picked when no manual choice, rule or default applies (§6.3 step 4).
 * Stored as a varchar for the same reason as {@link FulfilmentModel}.
 */
public enum AllocationStrategy {
    /** Fewest transit days, then lowest rate. */
    FASTEST,
    /** Lowest rate, then fewest transit days. */
    CHEAPEST,
    /** Lowest partner priority, then fewest transit days. */
    PRIORITY;

    public static Optional<AllocationStrategy> parse(String value) {
        if (value == null || value.isBlank()) return Optional.empty();
        String wanted = value.trim().toUpperCase();
        return Arrays.stream(values()).filter(s -> s.name().equals(wanted)).findFirst();
    }
}
