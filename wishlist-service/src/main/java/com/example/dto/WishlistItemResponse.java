package com.example.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WishlistItemResponse {

    private final Long id;
    private final Long itemId;
    private final String itemName;
    private final BigDecimal priceAtSave;
    private final LocalDateTime createdAt;

    public WishlistItemResponse(Long id, Long itemId, String itemName,
                                BigDecimal priceAtSave, LocalDateTime createdAt) {
        this.id = id;
        this.itemId = itemId;
        this.itemName = itemName;
        this.priceAtSave = priceAtSave;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getItemId() { return itemId; }
    public String getItemName() { return itemName; }
    public BigDecimal getPriceAtSave() { return priceAtSave; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
