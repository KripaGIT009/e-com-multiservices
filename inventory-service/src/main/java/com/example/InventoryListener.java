package com.example;

import com.example.common.SagaEvent;
import org.springframework.kafka.annotation.KafkaListener;
import com.example.service.IInventoryService;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class InventoryListener {

    private final KafkaTemplate<String, SagaEvent> kafka;
    private final IInventoryService inventoryService;

    public InventoryListener(KafkaTemplate<String, SagaEvent> kafka, IInventoryService inventoryService) {
        this.kafka = kafka;
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "inventory-command", containerFactory = "sagaEventKafkaListenerContainerFactory")
    public void handle(SagaEvent e) {
        if ("ReserveInventory".equals(e.type())) {
            boolean ok = inventoryService.reserve("DEFAULT-SKU", 1);
            kafka.send("inventory-events",
                new SagaEvent(e.orderId(), ok ? "InventoryReserved" : "InventoryNotAvailable", null));
        }
    }
}
