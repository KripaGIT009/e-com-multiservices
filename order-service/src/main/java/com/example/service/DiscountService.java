package com.example.service;

import com.example.dto.DiscountResponse;
import com.example.entity.Discount;
import com.example.repository.DiscountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DiscountService {

    @Autowired
    private DiscountRepository discountRepository;

    public DiscountResponse applyDiscount(String couponCode, BigDecimal cartTotal) {
        DiscountResponse response = new DiscountResponse();
        
        Optional<Discount> discount = discountRepository.findByCodeIgnoreCase(couponCode);
        
        if (!discount.isPresent()) {
            response.setMessage("Coupon code not found");
            return response;
        }
        
        Discount d = discount.get();
        LocalDateTime now = LocalDateTime.now();
        
        // Validate discount
        if (!d.getIsActive()) {
            response.setMessage("This coupon is inactive");
            return response;
        }
        
        if (now.isBefore(d.getValidFrom())) {
            response.setMessage("This coupon is not yet valid");
            return response;
        }
        
        if (now.isAfter(d.getValidUntil())) {
            response.setMessage("This coupon has expired");
            return response;
        }
        
        if (d.getUsedCount() >= d.getMaxUses()) {
            response.setMessage("This coupon has reached its maximum usage limit");
            return response;
        }
        
        if (cartTotal.compareTo(d.getMinPurchaseAmount()) < 0) {
            response.setMessage("Minimum purchase amount of ₹" + d.getMinPurchaseAmount() + " required");
            return response;
        }
        
        // Calculate discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        
        if (d.getDiscountType() == 1) { // Percentage
            discountAmount = cartTotal.multiply(d.getDiscountValue()).divide(new BigDecimal(100));
        } else { // Fixed Amount
            discountAmount = d.getDiscountValue();
            if (discountAmount.compareTo(cartTotal) > 0) {
                discountAmount = cartTotal;
            }
        }
        
        BigDecimal finalAmount = cartTotal.subtract(discountAmount);
        if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
            finalAmount = BigDecimal.ZERO;
        }
        
        // Update discount usage
        d.setUsedCount(d.getUsedCount() + 1);
        discountRepository.save(d);
        
        // Build response
        response.setId(d.getId());
        response.setCode(d.getCode());
        response.setDescription(d.getDescription());
        response.setDiscountType(d.getDiscountType());
        response.setDiscountValue(d.getDiscountValue());
        response.setOriginalAmount(cartTotal);
        response.setDiscountAmount(discountAmount);
        response.setFinalAmount(finalAmount);
        response.setMessage("Coupon applied successfully!");
        
        return response;
    }

    public DiscountResponse validateDiscount(String couponCode) {
        DiscountResponse response = new DiscountResponse();
        
        Optional<Discount> discount = discountRepository.findByCodeIgnoreCase(couponCode);
        
        if (!discount.isPresent()) {
            response.setMessage("Coupon code not found");
            return response;
        }
        
        Discount d = discount.get();
        LocalDateTime now = LocalDateTime.now();
        
        if (!d.getIsActive()) {
            response.setMessage("This coupon is inactive");
            return response;
        }
        
        if (now.isBefore(d.getValidFrom()) || now.isAfter(d.getValidUntil())) {
            response.setMessage("This coupon is not valid at this time");
            return response;
        }
        
        if (d.getUsedCount() >= d.getMaxUses()) {
            response.setMessage("This coupon has reached its usage limit");
            return response;
        }
        
        response.setId(d.getId());
        response.setCode(d.getCode());
        response.setDescription(d.getDescription());
        response.setDiscountType(d.getDiscountType());
        response.setDiscountValue(d.getDiscountValue());
        response.setMessage("Coupon is valid");
        
        return response;
    }
}
