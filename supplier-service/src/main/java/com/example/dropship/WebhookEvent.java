package com.example.dropship;

import com.example.entity.SupplierOrderStatus;

/**
 * A verified, parsed partner webhook. An adapter returns one only after checking the
 * partner's signature over the raw body.
 */
public record WebhookEvent(String partnerOrderRef,
                           SupplierOrderStatus status,
                           String trackingNumber,
                           String carrierName,
                           String note) {
}
