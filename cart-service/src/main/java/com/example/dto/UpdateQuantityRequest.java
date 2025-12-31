package com.example.dto;

public class UpdateQuantityRequest {
    private Integer quantity;

    public UpdateQuantityRequest() {}

    public UpdateQuantityRequest(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
