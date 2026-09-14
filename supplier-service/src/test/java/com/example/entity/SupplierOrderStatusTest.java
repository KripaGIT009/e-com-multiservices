package com.example.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static com.example.entity.SupplierOrderStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

class SupplierOrderStatusTest {

    @ParameterizedTest(name = "{0} -> {1} is legal")
    @CsvSource({
        "CREATED, AWAITING_MANUAL_PLACEMENT",
        "CREATED, SUBMITTED",
        "CREATED, FAILED",
        "CREATED, CANCELLED",
        "AWAITING_MANUAL_PLACEMENT, SUBMITTED",
        "AWAITING_MANUAL_PLACEMENT, ACCEPTED",
        "AWAITING_MANUAL_PLACEMENT, SHIPPED",
        "AWAITING_MANUAL_PLACEMENT, CANCELLED",
        "SUBMITTED, ACCEPTED",
        "SUBMITTED, SHIPPED",
        "SUBMITTED, CANCELLED",
        "ACCEPTED, SHIPPED",
        "ACCEPTED, CANCELLED",
        "SHIPPED, DELIVERED",
        "FAILED, CREATED"
    })
    void legalTransitions(SupplierOrderStatus from, SupplierOrderStatus to) {
        assertThat(from.canTransitionTo(to)).isTrue();
    }

    @ParameterizedTest(name = "{0} -> {1} is illegal")
    @CsvSource({
        "CREATED, SHIPPED",
        "CREATED, DELIVERED",
        "CREATED, ACCEPTED",
        "AWAITING_MANUAL_PLACEMENT, DELIVERED",
        "AWAITING_MANUAL_PLACEMENT, FAILED",
        "SUBMITTED, AWAITING_MANUAL_PLACEMENT",
        "SUBMITTED, DELIVERED",
        "ACCEPTED, SUBMITTED",
        "SHIPPED, CANCELLED",
        "SHIPPED, ACCEPTED",
        "DELIVERED, SHIPPED",
        "DELIVERED, CANCELLED",
        "CANCELLED, CREATED",
        "CANCELLED, SUBMITTED",
        "FAILED, SUBMITTED",
        "FAILED, CANCELLED",
        "CREATED, CREATED",
        "SHIPPED, SHIPPED"
    })
    void illegalTransitions(SupplierOrderStatus from, SupplierOrderStatus to) {
        assertThat(from.canTransitionTo(to)).isFalse();
    }

    @Test
    void exactlyFifteenLegalTransitionsExist() {
        long legal = 0;
        for (SupplierOrderStatus from : values()) {
            for (SupplierOrderStatus to : values()) {
                if (from.canTransitionTo(to)) legal++;
            }
        }
        assertThat(legal).isEqualTo(15);
    }

    @Test
    void deliveredAndCancelledAreTerminal() {
        assertThat(DELIVERED.isTerminal()).isTrue();
        assertThat(CANCELLED.isTerminal()).isTrue();
        assertThat(FAILED.isTerminal()).isFalse();
    }

    @Test
    void manualNextStatusesNeverOfferCreated() {
        assertThat(FAILED.manualNextStatuses()).isEmpty();
        assertThat(CREATED.manualNextStatuses())
            .containsExactly(AWAITING_MANUAL_PLACEMENT, SUBMITTED, FAILED, CANCELLED);
        assertThat(SHIPPED.manualNextStatuses()).isEqualTo(List.of(DELIVERED));
    }

    @Test
    void parseIsLenientOnCaseAndRejectsUnknown() {
        assertThat(SupplierOrderStatus.parse(" shipped ")).isEqualTo(SHIPPED);
        assertThat(SupplierOrderStatus.parse("LOST")).isNull();
        assertThat(SupplierOrderStatus.parse(null)).isNull();
    }
}
