package com.example.dto;

import com.example.entity.AllocationSettings;

import java.time.LocalDateTime;

public record AllocationSettingsResponse(
        String fulfilmentModel,
        String defaultPartnerCode,
        String fallbackStrategy,
        boolean allowManualOverride,
        LocalDateTime updatedAt
) {
    public static AllocationSettingsResponse from(AllocationSettings s) {
        return new AllocationSettingsResponse(s.getFulfilmentModel(), s.getDefaultPartnerCode(),
            s.effectiveStrategy().name(), s.manualOverrideAllowed(), s.getUpdatedAt());
    }
}
