package com.example.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDTO {
    private Long id;
    private String productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private String description;
    private Long sellerId;
    private String sellerName;
    /** Never null: lines created before M1 resolve to SELLER when sellerId is set, else FIRST_PARTY. */
    private String fulfilmentModel;
    private String fulfilmentPartnerCode;
}
