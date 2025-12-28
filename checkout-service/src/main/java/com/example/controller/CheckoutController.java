package com.example.controller;

import com.example.dto.CheckoutRequest;
import com.example.entity.Checkout;
import com.example.service.ICheckoutService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/checkouts")
public class CheckoutController {

    @Autowired
    private ICheckoutService checkoutService;

    @PostMapping
    public ResponseEntity<Checkout> createCheckout(@RequestBody CheckoutRequest request) {
        Checkout checkout = checkoutService.createCheckout(request.getUserId(), request.getCartId(), request.getTotalAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(checkout);
    }

    @GetMapping("/{checkoutId}")
    public ResponseEntity<Checkout> getCheckout(@PathVariable Long checkoutId) {
        Optional<Checkout> checkout = checkoutService.getCheckout(checkoutId);
        return checkout.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Checkout>> getCheckoutsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(checkoutService.getCheckoutsByUserId(userId));
    }

    @GetMapping("/cart/{cartId}")
    public ResponseEntity<Checkout> getCheckoutByCartId(@PathVariable Long cartId) {
        Optional<Checkout> checkout = checkoutService.getCheckoutByCartId(cartId);
        return checkout.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{checkoutId}/status")
    public ResponseEntity<Checkout> updateCheckoutStatus(@PathVariable Long checkoutId, @RequestParam String status) {
        Checkout checkout = checkoutService.updateCheckoutStatus(checkoutId, status);
        return checkout != null ? ResponseEntity.ok(checkout) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{checkoutId}/payment-status")
    public ResponseEntity<Checkout> updatePaymentStatus(@PathVariable Long checkoutId, @RequestParam String paymentStatus) {
        Checkout checkout = checkoutService.updatePaymentStatus(checkoutId, paymentStatus);
        return checkout != null ? ResponseEntity.ok(checkout) : ResponseEntity.notFound().build();
    }
}
