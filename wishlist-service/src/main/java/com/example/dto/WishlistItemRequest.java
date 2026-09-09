package com.example.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WishlistItemRequest {

    @NotNull(message = "itemId is required")
    private Long itemId;

    private String itemName;
    private BigDecimal price;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
