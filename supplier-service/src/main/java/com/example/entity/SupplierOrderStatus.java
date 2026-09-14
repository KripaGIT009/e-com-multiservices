package com.example.entity;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Lifecycle of an order placed with a dropship partner. The transition table is the
 * status machine in docs/commerce-architecture.md §9.4 — change both together.
 */
public enum SupplierOrderStatus {
    CREATED,
    AWAITING_MANUAL_PLACEMENT,
    SUBMITTED,
    ACCEPTED,
    SHIPPED,
    DELIVERED,
    FAILED,
    CANCELLED;

    private static final Map<SupplierOrderStatus, Set<SupplierOrderStatus>> NEXT = Map.of(
        CREATED, EnumSet.of(AWAITING_MANUAL_PLACEMENT, SUBMITTED, FAILED, CANCELLED),
        // A manual partner may skip steps: the operator records what actually happened.
        AWAITING_MANUAL_PLACEMENT, EnumSet.of(SUBMITTED, ACCEPTED, SHIPPED, CANCELLED),
        SUBMITTED, EnumSet.of(ACCEPTED, SHIPPED, CANCELLED),
        ACCEPTED, EnumSet.of(SHIPPED, CANCELLED),
        SHIPPED, EnumSet.of(DELIVERED),
        // Only through POST /retry, never through a status update.
        FAILED, EnumSet.of(CREATED),
        DELIVERED, EnumSet.noneOf(SupplierOrderStatus.class),
        CANCELLED, EnumSet.noneOf(SupplierOrderStatus.class)
    );

    public boolean canTransitionTo(SupplierOrderStatus target) {
        return target != null && NEXT.get(this).contains(target);
    }

    public boolean isTerminal() {
        return NEXT.get(this).isEmpty();
    }

    /**
     * Statuses an operator may set through PUT /status. CREATED is excluded because the
     * only way back to it is retry, which also re-costs and resubmits the order.
     */
    public List<SupplierOrderStatus> manualNextStatuses() {
        return Arrays.stream(values())
            .filter(s -> s != CREATED && canTransitionTo(s))
            .toList();
    }

    /** Null when the value is not a known status. */
    public static SupplierOrderStatus parse(String value) {
        if (value == null) return null;
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
