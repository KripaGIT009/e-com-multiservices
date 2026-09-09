package com.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One saved product for one customer.
 *
 * Name and price are snapshots taken when the item was saved, so a wishlist still
 * renders if the product is later renamed or withdrawn — and so a price drop can be
 * detected by comparing the snapshot against the live catalogue.
 */
@Entity
@Table(
    name = "wishlist_items",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_wishlist_user_item",
        columnNames = {"user_id", "item_id"}
    ),
    indexes = @Index(name = "idx_wishlist_user", columnList = "user_id")
)
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    /** Price when saved. Compared against the live price to spot a drop. */
    @Column(name = "price_at_save", precision = 19, scale = 4)
    private BigDecimal priceAtSave;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected WishlistItem() { }

    public WishlistItem(Long userId, Long itemId, String itemName, BigDecimal priceAtSave) {
        this.userId = userId;
        this.itemId = itemId;
        this.itemName = itemName;
        this.priceAtSave = priceAtSave;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public BigDecimal getPriceAtSave() { return priceAtSave; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
