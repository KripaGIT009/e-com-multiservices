package com.example.dto;

import com.example.entity.Seller;
import com.example.entity.SellerStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/** Request and response shapes for the seller API, kept together as they are small. */
public class SellerDtos {

    public static class RegisterRequest {
        @NotBlank(message = "Business name is required")
        public String businessName;
        @NotBlank(message = "Contact name is required")
        public String contactName;
        @NotBlank @Email(message = "A valid email is required")
        public String email;
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        public String password;
        @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
        public String phone;
        // 15 characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 checksum.
        @Pattern(regexp = "^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$",
                 message = "Enter a valid 15-character GSTIN")
        public String gstin;
        public String pickupAddress;
        public String pickupCity;
        public String pickupPostalCode;
    }

    public static class LoginRequest {
        @NotBlank public String email;
        @NotBlank public String password;
    }

    public static class StatusRequest {
        @NotNull public SellerStatus status;
        public String reason;
    }

    /** Never carries the password hash. */
    public static class SellerResponse {
        public Long id;
        public String businessName;
        public String contactName;
        public String email;
        public String phone;
        public String gstin;
        public String pickupAddress;
        public String pickupCity;
        public String pickupPostalCode;
        public SellerStatus status;
        public String statusReason;
        public LocalDateTime createdAt;

        public static SellerResponse from(Seller s) {
            SellerResponse r = new SellerResponse();
            r.id = s.getId();
            r.businessName = s.getBusinessName();
            r.contactName = s.getContactName();
            r.email = s.getEmail();
            r.phone = s.getPhone();
            r.gstin = s.getGstin();
            r.pickupAddress = s.getPickupAddress();
            r.pickupCity = s.getPickupCity();
            r.pickupPostalCode = s.getPickupPostalCode();
            r.status = s.getStatus();
            r.statusReason = s.getStatusReason();
            r.createdAt = s.getCreatedAt();
            return r;
        }
    }
}
