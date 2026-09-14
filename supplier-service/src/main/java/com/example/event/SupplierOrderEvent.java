package com.example.event;

/**
 * Envelope on {@code supplier-order-events}, shaped like the existing {@code SagaEvent}
 * on order/shipment topics: the customer order id, an event type and a JSON payload.
 */
public record SupplierOrderEvent(String orderId, String type, String data) {

    public static final String CREATED = "SupplierOrderCreated";
    public static final String STATUS_CHANGED = "SupplierOrderStatusChanged";
}
