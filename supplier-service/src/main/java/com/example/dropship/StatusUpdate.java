package com.example.dropship;

import com.example.entity.SupplierOrderStatus;

/** A partner's view of one of its orders, as returned by polling. */
public record StatusUpdate(String partnerOrderRef,
                           SupplierOrderStatus status,
                           String trackingNumber,
                           String carrierName,
                           String trackingUrl,
                           String note) {
}
