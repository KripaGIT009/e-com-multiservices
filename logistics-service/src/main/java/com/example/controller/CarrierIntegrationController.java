package com.example.controller;

import com.example.carrier.CarrierAdapter;
import com.example.carrier.CarrierAdapterRegistry;
import com.example.carrier.CarrierCapability;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * Which carrier adapters this build contains and whether each has its credentials.
 * Lets an admin see that switching a partner to DELHIVERY will really call the API
 * before doing it (§7.3). Lists environment variable names only, never values.
 */
@RestController
@RequestMapping("/api/carrier-integrations")
public class CarrierIntegrationController {

    public record CarrierIntegration(String key, String label, boolean configured,
                                     List<String> capabilities, List<String> requiredEnvironment) { }

    private final CarrierAdapterRegistry registry;

    public CarrierIntegrationController(CarrierAdapterRegistry registry) {
        this.registry = registry;
    }

    @GetMapping
    public List<CarrierIntegration> list() {
        return registry.all().stream()
            .sorted(Comparator.comparing((CarrierAdapter a) -> !CarrierAdapterRegistry.MANUAL.equalsIgnoreCase(a.key()))
                .thenComparing(a -> a.key().toUpperCase()))
            .map(a -> new CarrierIntegration(
                a.key().toUpperCase(), a.label(), a.isConfigured(),
                a.capabilities().stream().map(CarrierCapability::name).sorted().toList(),
                List.copyOf(a.requiredEnvironment())))
            .toList();
    }
}
