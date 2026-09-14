package com.example.dto;

/**
 * Body of PUT /api/allocation-settings/{model}. A null or blank defaultPartnerCode clears
 * the default; a null strategy or override flag leaves the stored value unchanged.
 */
public record AllocationSettingsRequest(
        String defaultPartnerCode,
        String fallbackStrategy,
        Boolean allowManualOverride
) { }
