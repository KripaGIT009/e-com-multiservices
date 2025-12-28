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
}
