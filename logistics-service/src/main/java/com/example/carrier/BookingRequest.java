package com.example.carrier;

import java.math.BigDecimal;

/**
 * Everything a carrier needs to accept a parcel.
 *
 * @param orderId        our order id — used as the carrier's order reference
 * @param fulfilmentKey  which part of the order this parcel is (FIRST_PARTY, SELLER:3, …)
 * @param partnerCode    our code for the carrier
 * @param weightGrams    never null here; the caller has already applied the default
 * @param trackingNumber operator-entered number, honoured by the MANUAL adapter only
 */
public record BookingRequest(
        String orderId,
        String fulfilmentKey,
        String partnerCode,
        String customerName,
        String customerPhone,
        String deliveryAddress,
        String deliveryPincode,
        String pickupPincode,
        int weightGrams,
        boolean cod,
        BigDecimal declaredValue,
        String trackingNumber
) { }
