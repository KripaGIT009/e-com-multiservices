package com.example.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "sellers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_seller_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_seller_gstin", columnNames = "gstin")
    }
)
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String businessName;

    @Column(nullable = false, length = 120)
    private String contactName;

    @Column(nullable = false, length = 160)
    private String email;

    /** BCrypt. Never returned in any DTO. */
    @Column(nullable = false, length = 100)
    private String password;

    @Column(nullable = false, length = 20)
    private String phone;

    /** India's GST registration number — the marketplace's identity check. */
    @Column(length = 15)
    private String gstin;

    @Column(length = 200)
    private String pickupAddress;

    @Column(length = 100)
    private String pickupCity;

    @Column(length = 20)
    private String pickupPostalCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SellerStatus status = SellerStatus.PENDING_APPROVAL;

    /** Why an admin rejected or suspended them — shown back to the seller. */
    @Column(length = 400)
    private String statusReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) status = SellerStatus.PENDING_APPROVAL;
    }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String v) { this.businessName = v; }
    public String getContactName() { return contactName; }
    public void setContactName(String v) { this.contactName = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getGstin() { return gstin; }
    public void setGstin(String v) { this.gstin = v; }
    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String v) { this.pickupAddress = v; }
    public String getPickupCity() { return pickupCity; }
    public void setPickupCity(String v) { this.pickupCity = v; }
    public String getPickupPostalCode() { return pickupPostalCode; }
    public void setPickupPostalCode(String v) { this.pickupPostalCode = v; }
    public SellerStatus getStatus() { return status; }
    public void setStatus(SellerStatus v) { this.status = v; }
    public String getStatusReason() { return statusReason; }
    public void setStatusReason(String v) { this.statusReason = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
