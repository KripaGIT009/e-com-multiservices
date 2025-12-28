package com.example.dto;

import java.math.BigDecimal;

public class CheckoutRequest {
    private Long userId;
    private Long cartId;
    private BigDecimal totalAmount;

    public CheckoutRequest() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getCartId() { return cartId; }
    public void setCartId(Long cartId) { this.cartId = cartId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
}
