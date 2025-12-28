package com.example.controller;

import com.example.dto.CreateShipmentRequest;
import com.example.dto.UpdateShipmentStatusRequest;
import com.example.entity.Shipment;
import com.example.entity.ShipmentEvent;
import com.example.service.ShipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @PostMapping
    public ResponseEntity<Shipment> create(@RequestBody CreateShipmentRequest request) {
        return ResponseEntity.ok(shipmentService.createShipment(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        Optional<Shipment> shipment = shipmentService.getShipment(id);
        return shipment.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Shipment> getByOrder(@PathVariable String orderId) {
        Optional<Shipment> shipment = shipmentService.getShipmentByOrder(orderId);
        return shipment.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<ShipmentEvent>> events(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.history(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id, @RequestBody UpdateShipmentStatusRequest request) {
        return ResponseEntity.ok(shipmentService.updateStatus(id, request));
    }
}
