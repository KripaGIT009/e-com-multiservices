package com.example.carrier.http;

/**
 * The order reference we lodge with a carrier: one per parcel, not per order, because a
 * marketplace order ships as several fulfilment groups (docs/commerce-architecture.md §4.1).
 *
 * {@code 1042} + {@code SELLER:3} becomes {@code 1042-SELLER-3}. Carriers reject or mangle
 * ':' in reference fields, so it is replaced.
 */
public final class CarrierOrderReference {

    private CarrierOrderReference() {
    }

    public static String of(String orderId, String fulfilmentKey) {
        String order = orderId == null ? "" : orderId.trim();
        if (fulfilmentKey == null || fulfilmentKey.isBlank()) return order;
        return order + "-" + fulfilmentKey.trim().replace(':', '-');
    }
}
