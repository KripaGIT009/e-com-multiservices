package com.example.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderItemRequest {
    private String productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String description;
}
