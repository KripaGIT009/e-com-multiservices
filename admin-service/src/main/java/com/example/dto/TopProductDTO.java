package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TopProductDTO {
    private Long productId;
    private String productName;
    private long totalQuantitySold;
    private BigDecimal totalRevenue;
}
