package com.example.service;

import com.example.entity.Checkout;
import com.example.repository.CheckoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CheckoutService {

    @Autowired
    private CheckoutRepository checkoutRepository;

    public Checkout createCheckout(Long userId, Long cartId, BigDecimal totalAmount) {
        Checkout checkout = new Checkout(userId, cartId, totalAmount);
        checkout.setCreatedAt(LocalDateTime.now());
        checkout.setUpdatedAt(LocalDateTime.now());
        return checkoutRepository.save(checkout);
    }

    public Optional<Checkout> getCheckout(Long checkoutId) {
        return checkoutRepository.findById(checkoutId);
    }

    public List<Checkout> getCheckoutsByUserId(Long userId) {
        return checkoutRepository.findByUserId(userId);
    }

    public Optional<Checkout> getCheckoutByCartId(Long cartId) {
        return checkoutRepository.findByCartId(cartId);
    }

    public Checkout updateCheckoutStatus(Long checkoutId, String status) {
        Checkout checkout = checkoutRepository.findById(checkoutId).orElse(null);
        if (checkout != null) {
            checkout.setStatus(status);
            checkout.setUpdatedAt(LocalDateTime.now());
            return checkoutRepository.save(checkout);
        }
        return null;
    }

    public Checkout updatePaymentStatus(Long checkoutId, String paymentStatus) {
        Checkout checkout = checkoutRepository.findById(checkoutId).orElse(null);
        if (checkout != null) {
            checkout.setPaymentStatus(paymentStatus);
            checkout.setUpdatedAt(LocalDateTime.now());
            return checkoutRepository.save(checkout);
        }
        return null;
    }
}
