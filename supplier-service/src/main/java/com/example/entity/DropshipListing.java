package com.example.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * The private link from a catalogue item (item-service id, not a foreign key — ADR-0001)
 * to a partner SKU and what the partner charges us for it.
 */
@Entity
@Table(name = "dropship_listings",
       uniqueConstraints = @UniqueConstraint(name = "uk_listing_partner_sku",
                                             columnNames = {"partner_code", "partner_sku"}))
public class DropshipListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_id", nullable = false, unique = true)
    private Long itemId;

    @Column(name = "partner_code", nullable = false, length = 30)
    private String partnerCode;

    @Column(name = "partner_sku", nullable = false, length = 80)
    private String partnerSku;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costPrice;

    private Integer partnerStock;

    private LocalDateTime lastSyncedAt;

    @Column(nullable = false)
    private Boolean active = true;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isActive() { return Boolean.TRUE.equals(active); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getPartnerSku() { return partnerSku; }
    public void setPartnerSku(String partnerSku) { this.partnerSku = partnerSku; }
    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }
    public Integer getPartnerStock() { return partnerStock; }
    public void setPartnerStock(Integer partnerStock) { this.partnerStock = partnerStock; }
    public LocalDateTime getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(LocalDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
