package com.example.controller;

import com.example.dto.InventoryRequest;
import com.example.dto.InventoryReservationRequest;
import com.example.common.SagaEvent;
import org.springframework.kafka.core.KafkaTemplate;
import com.example.entity.InventoryItem;
import com.example.service.InventoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService service;
    private final KafkaTemplate<String, SagaEvent> kafka;

    public InventoryController(InventoryService service, KafkaTemplate<String, SagaEvent> kafka) {
        this.service = service;
        this.kafka = kafka;
    }

    @PostMapping
    public ResponseEntity<InventoryItem> add(@RequestBody InventoryRequest request) {
        InventoryItem item = service.addItem(request.getSku(), request.getQuantity());
        return ResponseEntity.ok(item);
    }

    @GetMapping("/{sku}")
    public ResponseEntity<InventoryItem> get(@PathVariable String sku) {
        Optional<InventoryItem> item = service.getItem(sku);
        return item.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/reserve")
    public ResponseEntity<?> reserve(@RequestBody InventoryReservationRequest request) {
        boolean ok = service.reserve(request.getSku(), request.getQuantity());
        if (ok) {
            kafka.send("inventory-events", new SagaEvent(request.getOrderId(), "InventoryReserved", null));
            return ResponseEntity.ok().build();
        }
        kafka.send("inventory-events", new SagaEvent(request.getOrderId(), "InventoryNotAvailable", null));
        return ResponseEntity.badRequest().body("Not enough inventory");
    }

    @PostMapping("/release")
    public ResponseEntity<?> release(@RequestBody InventoryReservationRequest request) {
        service.release(request.getSku(), request.getQuantity());
        kafka.send("inventory-events", new SagaEvent(request.getOrderId(), "InventoryReleased", null));
        return ResponseEntity.ok().build();
    }
}
