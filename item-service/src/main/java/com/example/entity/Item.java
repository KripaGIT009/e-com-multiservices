package com.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = true)
    private String itemType;

    /**
     * Owning seller. Null means first-party stock sold by MyIndianStore itself —
     * the platform supports both, per the business model in the spec.
     */
    @Column(name = "seller_id")
    private Long sellerId;

    /** Snapshot of the seller's trade name, so listings render without a join. */
    @Column(name = "seller_name", length = 160)
    private String sellerName;

    /**
     * {@link FulfilmentModel} name, stored as varchar rather than {@code @Enumerated}
     * (a Hibernate 6 enum CHECK constraint cannot be widened by ddl-auto). Nullable:
     * rows written before M1 have no value and are resolved by
     * {@link #resolvedFulfilmentModel()}, so no data migration is needed.
     */
    @Column(name = "fulfilment_model", length = 20)
    private String fulfilmentModel;

    /** Dropship partner code (e.g. {@code QIKINK}); set only for DROPSHIP items. */
    @Column(name = "fulfilment_partner_code", length = 40)
    private String fulfilmentPartnerCode;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Item() {}

    public Item(String sku, String name, String description, BigDecimal price, Integer quantity) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    public Item(String sku, String name, String description, BigDecimal price, Integer quantity, String itemType) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.itemType = itemType;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }

    public String getFulfilmentModel() { return fulfilmentModel; }
    public void setFulfilmentModel(String fulfilmentModel) { this.fulfilmentModel = fulfilmentModel; }
    public String getFulfilmentPartnerCode() { return fulfilmentPartnerCode; }
    public void setFulfilmentPartnerCode(String fulfilmentPartnerCode) { this.fulfilmentPartnerCode = fulfilmentPartnerCode; }

    /**
     * The effective fulfilment model: the stored value when present and valid, otherwise
     * derived from ownership. Legacy rows (created before the column existed) have a null
     * model, and before M1 the only two kinds of listing were seller-owned (sellerId set)
     * and first-party (sellerId null) — so the derivation is exact and the column can be
     * added by ddl-auto without backfilling existing rows.
     */
    public FulfilmentModel resolvedFulfilmentModel() {
        return FulfilmentModel.parse(fulfilmentModel)
                .orElse(sellerId != null ? FulfilmentModel.SELLER : FulfilmentModel.FIRST_PARTY);
    }
}
