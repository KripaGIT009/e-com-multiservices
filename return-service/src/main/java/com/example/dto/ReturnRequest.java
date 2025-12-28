package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    private Long orderId;
    private Long userId;
    private String reason;
    private BigDecimal refundAmount;
    private String status;
}
