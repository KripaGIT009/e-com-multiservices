package com.example.dto;

import java.math.BigDecimal;

/**
 * Body of POST and PUT /api/delivery-partners.
 *
 * Every field is a wrapper so PUT can tell "not supplied" from "false"/"0" — the
 * previous entity-bound PUT read a primitive {@code active} and switched a partner off
 * whenever an edit omitted it.
 */
public record DeliveryPartnerRequest(
        String code,
        String name,
        String trackingUrlTemplate,
        Integer estimatedDays,
        BigDecimal baseRate,
        Boolean active,
        String servicePincodePrefixes,
        String integrationType,
        Boolean aggregator,
        Integer priority,
        Boolean codSupported
) { }
