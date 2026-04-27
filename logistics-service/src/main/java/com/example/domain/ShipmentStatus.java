package com.example.domain;

public enum ShipmentStatus {
    /** Order received, awaiting fulfilment */
    ORDER_PLACED,
    /** Warehouse is picking & packing */
    PROCESSING,
    /** Label printed, awaiting carrier pickup */
    LABEL_GENERATED,
    /** Carrier has picked up the package */
    PICKED_UP,
    /** Package is moving through the carrier network */
    IN_TRANSIT,
    /** Package is on the delivery vehicle today */
    OUT_FOR_DELIVERY,
    /** Delivery was attempted but no one was home */
    ATTEMPTED_DELIVERY,
    /** Delivered to customer */
    DELIVERED,
    /** Shipment issue (damaged, lost, held at customs, etc.) */
    EXCEPTION,
    /** Package returned to sender */
    RETURNED;

    /** Returns true if this status means shipment is still active */
    public boolean isActive() {
        return this != DELIVERED && this != RETURNED && this != EXCEPTION;
    }
}
