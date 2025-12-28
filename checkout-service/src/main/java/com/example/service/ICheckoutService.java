package com.example.service;

import com.example.entity.Checkout;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ICheckoutService {
    Checkout createCheckout(Long userId, Long cartId, BigDecimal totalAmount);
    Optional<Checkout> getCheckout(Long checkoutId);
    List<Checkout> getCheckoutsByUserId(Long userId);
    Optional<Checkout> getCheckoutByCartId(Long cartId);
    Checkout updateCheckoutStatus(Long checkoutId, String status);
    Checkout updatePaymentStatus(Long checkoutId, String paymentStatus);
}
