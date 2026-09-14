package com.example.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

/**
 * The subset of order-service's {@code OrderDTO} this service reads. Unknown fields are
 * ignored so order-service can grow without breaking dispatch.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OrderView(Long id,
                        String orderNumber,
                        String status,
                        List<Item> items,
                        Address shippingAddress) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(Long id,
                       String productId,
                       String productName,
                       Integer quantity,
                       BigDecimal unitPrice,
                       String fulfilmentModel,
                       String fulfilmentPartnerCode) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Address(String fullName,
                          String addressLine1,
                          String addressLine2,
                          String city,
                          String state,
                          String postalCode,
                          String phone) {
    }
}
