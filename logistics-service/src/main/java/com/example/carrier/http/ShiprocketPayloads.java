package com.example.carrier.http;

import com.example.carrier.BookingRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Request bodies for Shiprocket, per its published API documentation (not exercised
 * against a live account in this repository).
 */
public final class ShiprocketPayloads {

    private static final DateTimeFormatter ORDER_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /** We do not record parcel dimensions yet; Shiprocket requires them, so a nominal box is sent. */
    private static final int PARCEL_SIDE_CM = 10;

    private ShiprocketPayloads() {
    }

    /** Grams as kilograms with three decimals: 1250 becomes 1.250. */
    public static BigDecimal kilograms(int grams) {
        return BigDecimal.valueOf(grams).movePointLeft(3).setScale(3);
    }

    /** {@code POST /orders/create/adhoc}. The delivery address doubles as billing address. */
    public static Map<String, Object> adhocOrder(BookingRequest request, String pickupLocation, LocalDateTime orderDate) {
        BigDecimal value = request.declaredValue() == null ? BigDecimal.ZERO : request.declaredValue();
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("name", "Order " + request.orderId());
        item.put("sku", request.fulfilmentKey());
        item.put("units", 1);
        item.put("selling_price", value);

        Map<String, Object> order = new LinkedHashMap<>();
        order.put("order_id", CarrierOrderReference.of(request.orderId(), request.fulfilmentKey()));
        order.put("order_date", orderDate.format(ORDER_DATE));
        order.put("pickup_location", pickupLocation);
        order.put("billing_customer_name", nullToEmpty(request.customerName()));
        order.put("billing_last_name", "");
        order.put("billing_address", nullToEmpty(request.deliveryAddress()));
        order.put("billing_city", "");
        order.put("billing_pincode", nullToEmpty(request.deliveryPincode()));
        order.put("billing_state", "");
        order.put("billing_country", "India");
        order.put("billing_email", "");
        order.put("billing_phone", nullToEmpty(request.customerPhone()));
        order.put("shipping_is_billing", true);
        order.put("order_items", List.of(item));
        order.put("payment_method", request.cod() ? "COD" : "Prepaid");
        order.put("sub_total", value);
        order.put("length", PARCEL_SIDE_CM);
        order.put("breadth", PARCEL_SIDE_CM);
        order.put("height", PARCEL_SIDE_CM);
        order.put("weight", kilograms(request.weightGrams()));
        return order;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
