package com.example.dto;

import java.math.BigDecimal;

public class ItemRequest {
    private String sku;
    private String name;
    private String description;
    private BigDecimal price;
    private Integer quantity;
    private String itemType;

    public ItemRequest() {}

    public ItemRequest(String sku, String name, String description, BigDecimal price, Integer quantity) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    public ItemRequest(String sku, String name, String description, BigDecimal price, Integer quantity, String itemType) {
        this.sku = sku;
        this.name = name;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
        this.itemType = itemType;
    }

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
}
