package com.example.service;

import com.example.entity.InventoryItem;
import java.util.List;
import java.util.Optional;

public interface IInventoryService {
    InventoryItem addItem(String sku, int quantity);
    Optional<InventoryItem> getItem(String sku);
    List<InventoryItem> getAllItems();
    boolean reserve(String sku, int quantity);
    void release(String sku, int quantity);
}
