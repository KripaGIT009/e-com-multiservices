package com.example.dropship;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Every {@link DropshipAdapter} bean, by key. A new adapter class is picked up here with
 * no other change (P3).
 */
@Component
public class DropshipAdapterRegistry {

    public static final String MANUAL = "MANUAL";

    private final Map<String, DropshipAdapter> adapters;

    public DropshipAdapterRegistry(List<DropshipAdapter> adapters) {
        this.adapters = adapters.stream()
            .collect(Collectors.toMap(a -> a.key().toUpperCase(), Function.identity()));
        if (!this.adapters.containsKey(MANUAL)) {
            throw new IllegalStateException("The MANUAL dropship adapter must always be registered");
        }
    }

    /** The adapter for an integration type; null, blank or unknown resolves to MANUAL. */
    public DropshipAdapter forType(String integrationType) {
        if (integrationType == null || integrationType.isBlank()) return adapters.get(MANUAL);
        DropshipAdapter adapter = adapters.get(integrationType.trim().toUpperCase());
        return adapter != null ? adapter : adapters.get(MANUAL);
    }

    public DropshipAdapter manual() {
        return adapters.get(MANUAL);
    }

    public boolean isRegistered(String integrationType) {
        return integrationType != null && adapters.containsKey(integrationType.trim().toUpperCase());
    }

    /** MANUAL first, then alphabetical by key. */
    public Collection<DropshipAdapter> all() {
        return adapters.values().stream()
            .sorted(Comparator.comparing((DropshipAdapter a) -> !MANUAL.equals(a.key().toUpperCase()))
                .thenComparing(DropshipAdapter::key))
            .toList();
    }
}
