package com.example.dto;

import com.example.entity.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDTO {
    private Long id;
    private String orderNumber;
    private String customerId;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private List<OrderItemDTO> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String notes;

    private ShippingAddressDTO shippingAddress;
    /** Pre-formatted for lists and admin tables. Null when no address was captured. */
    private String shippingAddressLine;

    private String customerName;
    private String customerEmail;
    private String customerPhone;

    private String deliveryPartnerCode;
    private String deliveryPartnerName;
    private LocalDateTime expectedDelivery;
}
