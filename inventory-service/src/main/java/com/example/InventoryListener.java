package com.example;

import com.example.common.SagaEvent;
import org.springframework.kafka.annotation.KafkaListener;
import com.example.service.IInventoryService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

/**
 * Listens for inventory saga commands.
 * Expected data format in SagaEvent.data: "amount|sku1:qty1,sku2:qty2"
 * (produced by OrderServiceImpl when the saga starts)
 */
@Service
public class InventoryListener {

    private final KafkaTemplate<String, SagaEvent> kafka;
    private final IInventoryService inventoryService;

    public InventoryListener(KafkaTemplate<String, SagaEvent> kafka, IInventoryService inventoryService) {
        this.kafka = kafka;
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "inventory-command")
    public void handle(SagaEvent e) {
        if ("ReserveInventory".equals(e.type())) {
            boolean allReserved = reserveItems(e.data());
            kafka.send("inventory-events",
                new SagaEvent(e.orderId(), allReserved ? "InventoryReserved" : "InventoryNotAvailable", e.data()));
        } else if ("ReleaseInventory".equals(e.type())) {
            releaseItems(e.data());
        }
    }

    /**
     * Parses "amount|sku1:qty1,sku2:qty2" and reserves each item.
     * Falls back to DEFAULT-SKU:1 if data is missing or malformed.
     */
    private boolean reserveItems(String data) {
        if (data == null || data.isBlank()) {
            return inventoryService.reserve("DEFAULT-SKU", 1);
        }
        try {
            String itemsPart = data.contains("|") ? data.split("\\|", 2)[1] : data;
            for (String entry : itemsPart.split(",")) {
                String[] parts = entry.split(":");
                String sku = parts[0].trim();
                int qty = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 1;
                if (!inventoryService.reserve(sku, qty)) {
                    return false;
                }
            }
            return true;
        } catch (Exception ex) {
            return inventoryService.reserve("DEFAULT-SKU", 1);
        }
    }

    private void releaseItems(String data) {
        if (data == null || data.isBlank()) return;
        try {
            String itemsPart = data.contains("|") ? data.split("\\|", 2)[1] : data;
            for (String entry : itemsPart.split(",")) {
                String[] parts = entry.split(":");
                String sku = parts[0].trim();
                int qty = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 1;
                inventoryService.release(sku, qty);
            }
        } catch (Exception ignored) {}
    }
}
