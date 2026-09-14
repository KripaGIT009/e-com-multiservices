package com.example.dto;

import com.example.carrier.CarrierAdapter;
import com.example.carrier.CarrierAdapterRegistry;
import com.example.entity.DeliveryPartner;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A delivery partner as the BFF sees it. Keeps every JSON name the entity used to expose
 * so existing callers are unaffected, and reports the M1 fields with their NULL defaults
 * already applied, so no caller has to know that NULL means MANUAL / 100 / COD-capable.
 *
 * integrationConfigured / integrationLabel come from the adapter registry: they say
 * whether booking will actually reach the carrier's API or fall back to manual.
 */
public record DeliveryPartnerResponse(
        Long id,
        String code,
        String name,
        String trackingUrlTemplate,
        Integer estimatedDays,
        BigDecimal baseRate,
        boolean active,
        String servicePincodePrefixes,
        LocalDateTime createdAt,
        String integrationType,
        boolean aggregator,
        int priority,
        boolean codSupported,
        boolean integrationConfigured,
        String integrationLabel
) {
    public static DeliveryPartnerResponse from(DeliveryPartner p, CarrierAdapterRegistry registry) {
        String type = p.effectiveIntegrationType();
        // An integration type whose adapter was removed must not look configured: forType
        // would quietly answer with MANUAL, which is true for booking but not for this row.
        boolean registered = registry.isRegistered(type);
        CarrierAdapter adapter = registered ? registry.forType(type) : null;
        return new DeliveryPartnerResponse(
            p.getId(), p.getCode(), p.getName(), p.getTrackingUrlTemplate(),
            p.getEstimatedDays(), p.getBaseRate(), p.isActive(), p.getServicePincodePrefixes(),
            p.getCreatedAt(), type, p.isAggregatorPartner(), p.effectivePriority(), p.supportsCod(),
            adapter != null && adapter.isConfigured(),
            adapter != null ? adapter.label() : null);
    }
}
