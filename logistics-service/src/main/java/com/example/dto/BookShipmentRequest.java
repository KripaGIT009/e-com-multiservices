package com.example.dto;

import java.math.BigDecimal;

/**
 * Body of POST /api/shipments/book (§9.3). orderId, fulfilmentKey and partnerCode are
 * required. weightGrams is optional because the catalogue has no weight yet.
 */
public record BookShipmentRequest(
        String orderId,
        String customerId,
        String fulfilmentKey,
        String partnerCode,
        String deliveryAddress,
        String deliveryPincode,
        String customerName,
        String customerPhone,
        String pickupPincode,
        Integer weightGrams,
        Boolean cod,
        BigDecimal declaredValue,
        String trackingNumber
) { }
