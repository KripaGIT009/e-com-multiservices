package com.example.dto;

import com.example.entity.DeliveryPartner;

import java.math.BigDecimal;
import java.util.List;

/**
 * Result of a courier allocation, exactly the §9.3 shape. {@code selected} is null only
 * when {@code reason} is NONE; {@code manualOverrideRejected} explains a manual choice
 * that could not be honoured so the UI can say so instead of silently swapping couriers.
 */
public record QuoteResponse(
        Selected selected,
        String reason,
        Long ruleId,
        String ruleName,
        String explanation,
        String manualOverrideRejected,
        List<Candidate> candidates
) {
    public record Selected(String code, String name, Integer estimatedDays, BigDecimal baseRate,
                           String trackingUrlTemplate, String integrationType) {
        public static Selected of(DeliveryPartner p) {
            return new Selected(p.getCode(), p.getName(), p.getEstimatedDays(), p.getBaseRate(),
                p.getTrackingUrlTemplate(), p.effectiveIntegrationType());
        }
    }

    public record Candidate(String code, String name, Integer estimatedDays, BigDecimal baseRate) {
        public static Candidate of(DeliveryPartner p) {
            return new Candidate(p.getCode(), p.getName(), p.getEstimatedDays(), p.getBaseRate());
        }
    }
}
