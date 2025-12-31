package com.example.controller;

import com.example.dto.DiscountResponse;
import com.example.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/discounts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DiscountController {

    @Autowired
    private DiscountService discountService;

    @PostMapping("/apply")
    public ResponseEntity<DiscountResponse> applyDiscount(
            @RequestParam String couponCode,
            @RequestParam BigDecimal cartTotal) {
        DiscountResponse response = discountService.applyDiscount(couponCode, cartTotal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<DiscountResponse> validateDiscount(@RequestParam String couponCode) {
        DiscountResponse response = discountService.validateDiscount(couponCode);
        return ResponseEntity.ok(response);
    }
}
