package com.example.dto;

/**
 * Body of POST and PUT /api/courier-rules (§9.3). Prefixes and states are comma-separated;
 * at least one of them is required.
 */
public record CourierRuleRequest(
        String name,
        String partnerCode,
        String pincodePrefixes,
        String states,
        String fulfilmentModel,
        Integer priority,
        Boolean active
) { }
