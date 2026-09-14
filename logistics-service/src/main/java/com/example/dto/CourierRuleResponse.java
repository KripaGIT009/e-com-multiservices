package com.example.dto;

import com.example.entity.CourierRule;

import java.time.LocalDateTime;

public record CourierRuleResponse(
        Long id,
        String name,
        String partnerCode,
        String pincodePrefixes,
        String states,
        String fulfilmentModel,
        Integer priority,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CourierRuleResponse from(CourierRule r) {
        return new CourierRuleResponse(r.getId(), r.getName(), r.getPartnerCode(), r.getPincodePrefixes(),
            r.getStates(), r.getFulfilmentModel(), r.getPriority(), r.isEnabled(),
            r.getCreatedAt(), r.getUpdatedAt());
    }
}
