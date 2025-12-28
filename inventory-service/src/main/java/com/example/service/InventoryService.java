package com.example.service;

import com.example.entity.InventoryItem;
import com.example.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InventoryService {

    private final InventoryRepository repository;

    public InventoryService(InventoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public InventoryItem addItem(String sku, int quantity) {
        Optional<InventoryItem> existing = repository.findBySku(sku);
        if (existing.isPresent()) {
            InventoryItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            return repository.save(item);
        }
        return repository.save(new InventoryItem(sku, quantity));
    }

    public Optional<InventoryItem> getItem(String sku) {
        return repository.findBySku(sku);
    }

    @Transactional
    public boolean reserve(String sku, int quantity) {
        Optional<InventoryItem> existing = repository.findBySku(sku);
        if (existing.isEmpty()) {
            return false;
        }
        InventoryItem item = existing.get();
        if (item.getQuantity() < quantity) {
            return false;
        }
        item.setQuantity(item.getQuantity() - quantity);
        repository.save(item);
        return true;
    }

    @Transactional
    public void release(String sku, int quantity) {
        Optional<InventoryItem> existing = repository.findBySku(sku);
        if (existing.isPresent()) {
            InventoryItem item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            repository.save(item);
        }
    }
}
