package com.example.controller;

import com.example.dto.BookShipmentRequest;
import com.example.dto.CreateShipmentRequest;
import com.example.dto.ShipmentBookingResponse;
import com.example.dto.UpdateShipmentStatusRequest;
import com.example.entity.Shipment;
import com.example.entity.ShipmentEvent;
import com.example.service.IShipmentService;
import com.example.service.ShipmentBookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipments")
public class ShipmentController {

    private final IShipmentService shipmentService;
    private final ShipmentBookingService bookingService;

    public ShipmentController(IShipmentService shipmentService, ShipmentBookingService bookingService) {
        this.shipmentService = shipmentService;
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<Shipment>> getAll() {
        return ResponseEntity.ok(shipmentService.getAllShipments());
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

    /** Every shipment for the order, newest first — one per fulfilment group since M1. */
    @GetMapping("/order/{orderId}/all")
    public ResponseEntity<List<Shipment>> getAllByOrder(@PathVariable String orderId) {
        return ResponseEntity.ok(shipmentService.getShipmentsByOrder(orderId));
    }

    /** 201 for a new booking; 200 with alreadyBooked=true when the group was booked before. */
    @PostMapping("/book")
    public ResponseEntity<ShipmentBookingResponse> book(@RequestBody(required = false) BookShipmentRequest request) {
        ShipmentBookingResponse response = bookingService.book(request);
        return ResponseEntity.status(response.alreadyBooked() ? HttpStatus.OK : HttpStatus.CREATED).body(response);
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<Shipment> getByTrackingNumber(@PathVariable String trackingNumber) {
        return shipmentService.getShipmentByTrackingNumber(trackingNumber)
            .map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
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
