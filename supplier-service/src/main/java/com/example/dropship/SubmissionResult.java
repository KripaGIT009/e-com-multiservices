package com.example.dropship;

import com.example.entity.SupplierOrderStatus;

/**
 * Outcome of handing a supplier order to a partner.
 *
 * @param mode            {@code "API"} when the partner's system accepted it, {@code "MANUAL"}
 *                        when a person must place it
 * @param partnerOrderRef the partner's own reference; null when none was issued
 * @param status          the status the supplier order moves to
 * @param note            human-readable explanation, shown to operators
 */
public record SubmissionResult(String mode, String partnerOrderRef, SupplierOrderStatus status, String note) {

    public static final String MODE_API = "API";
    public static final String MODE_MANUAL = "MANUAL";
}
