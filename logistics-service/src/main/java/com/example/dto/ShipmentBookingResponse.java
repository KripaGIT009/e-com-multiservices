package com.example.dto;

import com.example.domain.ShipmentStatus;
import com.example.entity.Shipment;

import java.time.LocalDateTime;

/**
 * Response of POST /api/shipments/book: every Shipment field the entity already exposes,
 * plus the booking outcome.
 *
 * @param alreadyBooked   true when this (orderId, fulfilmentKey) was booked earlier and
 *                        the existing shipment is returned unchanged
 * @param weightGramsUsed the weight sent to the carrier — the configured default when the
 *                        caller gave none, so nobody mistakes it for a measured weight.
 *                        Null on a repeat: the weight is not stored with the shipment.
 */
public record ShipmentBookingResponse(
        Long id,
        String shipmentNumber,
        String orderId,
        String customerId,
        ShipmentStatus status,
        String carrier,
        String trackingNumber,
        LocalDateTime estimatedDelivery,
        String deliveryAddress,
        String carrierTrackingUrl,
        String lastStatusNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String fulfilmentKey,
        String partnerCode,
        String bookingMode,
        boolean trackingGenerated,
        String labelUrl,
        String bookingNote,
        boolean alreadyBooked,
        Integer weightGramsUsed
) {
    public static ShipmentBookingResponse from(Shipment s, boolean alreadyBooked, Integer weightGramsUsed) {
        return new ShipmentBookingResponse(
            s.getId(), s.getShipmentNumber(), s.getOrderId(), s.getCustomerId(), s.getStatus(),
            s.getCarrier(), s.getTrackingNumber(), s.getEstimatedDelivery(), s.getDeliveryAddress(),
            s.getCarrierTrackingUrl(), s.getLastStatusNote(), s.getCreatedAt(), s.getUpdatedAt(),
            s.getFulfilmentKey(), s.getPartnerCode(), s.getBookingMode(),
            Boolean.TRUE.equals(s.getTrackingGenerated()), s.getLabelUrl(), s.getBookingNote(),
            alreadyBooked, weightGramsUsed);
    }
}
