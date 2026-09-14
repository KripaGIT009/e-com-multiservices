package com.example.carrier;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Every {@link CarrierAdapter} bean, by key. This is what makes carriers plug-and-play:
 * a new adapter class is picked up here with no other change.
 */
@Component
public class CarrierAdapterRegistry {

    public static final String MANUAL = "MANUAL";

    private final Map<String, CarrierAdapter> adapters;

    public CarrierAdapterRegistry(List<CarrierAdapter> adapters) {
        this.adapters = adapters.stream()
            .collect(Collectors.toMap(a -> a.key().toUpperCase(), Function.identity()));
        if (!this.adapters.containsKey(MANUAL)) {
            throw new IllegalStateException("The MANUAL carrier adapter must always be registered");
        }
    }

    /** The adapter for a partner's integration type. Rows created before M1 have none: MANUAL. */
    public CarrierAdapter forType(String integrationType) {
        if (integrationType == null || integrationType.isBlank()) return adapters.get(MANUAL);
        CarrierAdapter adapter = adapters.get(integrationType.trim().toUpperCase());
        return adapter != null ? adapter : adapters.get(MANUAL);
    }

    public boolean isRegistered(String integrationType) {
        return integrationType != null && adapters.containsKey(integrationType.trim().toUpperCase());
    }

    public Collection<CarrierAdapter> all() {
        return adapters.values();
    }
}
