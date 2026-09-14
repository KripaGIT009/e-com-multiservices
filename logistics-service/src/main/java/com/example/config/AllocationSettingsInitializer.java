package com.example.config;

import com.example.service.AllocationSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Creates an allocation_settings row for each fulfilment model that has none.
 *
 * The seeded policy is FASTEST with no default courier and manual choice allowed — exactly
 * how couriers were picked before M1. Choosing a default courier is a business decision,
 * so it is left for an admin (§6.3). Existing rows are never touched.
 *
 * Runs on ApplicationReadyEvent rather than @PostConstruct so the call goes through the
 * transactional proxy of AllocationSettingsService.
 */
@Component
public class AllocationSettingsInitializer {

    private static final Logger log = LoggerFactory.getLogger(AllocationSettingsInitializer.class);
    private final AllocationSettingsService settings;

    public AllocationSettingsInitializer(AllocationSettingsService settings) {
        this.settings = settings;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seed() {
        int created = settings.seedMissing();
        if (created > 0) log.info("Seeded allocation settings for {} fulfilment model(s)", created);
    }
}
