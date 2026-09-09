package com.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A courier the marketplace can hand a shipment to.
 *
 * Kept as data rather than an enum so partners can be added, priced and switched off
 * without a deployment — which is how carrier contracts actually change.
 */
@Entity
@Table(name = "delivery_partners",
       uniqueConstraints = @UniqueConstraint(name = "uk_partner_code", columnNames = "code"))
public class DeliveryPartner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    /** Where {trackingNumber} is substituted to build a customer-facing tracking link. */
    @Column(length = 300)
    private String trackingUrlTemplate;

    /** Typical door-to-door time, used to quote an expected delivery date. */
    @Column(nullable = false)
    private Integer estimatedDays = 5;

    @Column(precision = 10, scale = 2)
    private BigDecimal baseRate;

    /** Whether this partner can be assigned new shipments. */
    @Column(nullable = false)
    private boolean active = true;

    /** Serviceable pincode prefixes, comma-separated. Empty means nationwide. */
    @Column(length = 500)
    private String servicePincodePrefixes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    public DeliveryPartner() { }

    public DeliveryPartner(String code, String name, String trackingUrlTemplate,
                           Integer estimatedDays, BigDecimal baseRate, String prefixes) {
        this.code = code;
        this.name = name;
        this.trackingUrlTemplate = trackingUrlTemplate;
        this.estimatedDays = estimatedDays;
        this.baseRate = baseRate;
        this.servicePincodePrefixes = prefixes;
        this.active = true;
    }

    /** True when this partner delivers to the given pincode. */
    public boolean servesPincode(String pincode) {
        if (servicePincodePrefixes == null || servicePincodePrefixes.isBlank()) return true;
        if (pincode == null || pincode.isBlank()) return false;
        for (String prefix : servicePincodePrefixes.split(",")) {
            if (pincode.trim().startsWith(prefix.trim())) return true;
        }
        return false;
    }

    public String buildTrackingUrl(String trackingNumber) {
        if (trackingUrlTemplate == null || trackingNumber == null) return null;
        return trackingUrlTemplate.replace("{trackingNumber}", trackingNumber);
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String v) { this.code = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getTrackingUrlTemplate() { return trackingUrlTemplate; }
    public void setTrackingUrlTemplate(String v) { this.trackingUrlTemplate = v; }
    public Integer getEstimatedDays() { return estimatedDays; }
    public void setEstimatedDays(Integer v) { this.estimatedDays = v; }
    public BigDecimal getBaseRate() { return baseRate; }
    public void setBaseRate(BigDecimal v) { this.baseRate = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { this.active = v; }
    public String getServicePincodePrefixes() { return servicePincodePrefixes; }
    public void setServicePincodePrefixes(String v) { this.servicePincodePrefixes = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
