package com.example.carrier;

/**
 * @param trackingNumber    the AWB, or for MANUAL the entered or generated number
 * @param generated         true only when we made the number up because nobody supplied one
 * @param labelUrl          carrier label, when the carrier returns one
 * @param carrierReference  the carrier's own shipment/order id, when distinct from the AWB
 * @param note              human-readable context shown with the shipment
 */
public record BookingResult(
        String trackingNumber,
        boolean generated,
        String labelUrl,
        String carrierReference,
        String note
) { }
