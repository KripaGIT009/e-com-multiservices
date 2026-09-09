package com.example.dto;

import com.example.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    private String customerId;
    private List<CreateOrderItemRequest> items;
    private String notes;

    /** Collected by the checkout form. Previously accepted and silently discarded. */
    private ShippingAddressDTO shippingAddress;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
