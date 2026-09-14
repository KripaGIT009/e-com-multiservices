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
    private Long sellerId;
    private String sellerName;
    /** FIRST_PARTY / SELLER / DROPSHIP, as resolved from item-service by the caller. */
    private String fulfilmentModel;
    /** Dropship partner code; null unless DROPSHIP. */
    private String fulfilmentPartnerCode;
}
