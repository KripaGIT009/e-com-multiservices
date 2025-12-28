package com.example.service;

import com.example.common.SagaEvent;
import com.example.domain.ShipmentStatus;
import com.example.dto.CreateShipmentRequest;
import com.example.dto.UpdateShipmentStatusRequest;
import com.example.entity.Shipment;
import com.example.entity.ShipmentEvent;
import com.example.repository.ShipmentEventRepository;
import com.example.repository.ShipmentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ShipmentService {

    private final ShipmentRepository shipments;
    private final ShipmentEventRepository shipmentEvents;
    private final KafkaTemplate<String, SagaEvent> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ShipmentService(ShipmentRepository shipments,
                           ShipmentEventRepository shipmentEvents,
                           KafkaTemplate<String, SagaEvent> kafkaTemplate,
                           ObjectMapper objectMapper) {
        this.shipments = shipments;
        this.shipmentEvents = shipmentEvents;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public Shipment createShipment(CreateShipmentRequest request) {
        String shipmentNumber = request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()
            ? request.getTrackingNumber()
            : "SHP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String trackingNumber = request.getTrackingNumber() == null || request.getTrackingNumber().isBlank()
            ? shipmentNumber
            : request.getTrackingNumber();
        String customerId = request.getCustomerId() == null || request.getCustomerId().isBlank() ? "UNKNOWN" : request.getCustomerId();
        Shipment shipment = new Shipment(
            shipmentNumber,
            request.getOrderId(),
            customerId,
            ShipmentStatus.CREATED,
            request.getCarrier() == null ? "STANDARD" : request.getCarrier(),
            trackingNumber,
            request.getEstimatedDelivery()
        );
        Shipment saved = shipments.save(shipment);
        recordEvent(saved.getId(), "ShipmentCreated", "Shipment created for order " + saved.getOrderId());
        publishShipmentEvent(saved, "ShipmentCreated");
        return saved;
    }

    public Shipment createFromOrderEvent(SagaEvent event) {
        if (event == null || event.orderId() == null) {
            throw new IllegalArgumentException("Order event missing order id");
        }
        Optional<Shipment> existing = shipments.findByOrderId(event.orderId());
        if (existing.isPresent()) {
            return existing.get();
        }
        CreateShipmentRequest request = new CreateShipmentRequest();
        request.setOrderId(event.orderId());
        if (event.data() != null && !event.data().contains("->")) {
            request.setCustomerId(event.data());
        }
        request.setCarrier("STANDARD");
        return createShipment(request);
    }

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipment(Long id) {
        return shipments.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentByOrder(String orderId) {
        return shipments.findByOrderId(orderId);
    }

    public Shipment updateStatus(Long id, UpdateShipmentStatusRequest request) {
        Shipment shipment = shipments.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + id));
        if (request.getStatus() != null) {
            shipment.setStatus(parseStatus(request.getStatus()));
        }
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            shipment.setTrackingNumber(request.getTrackingNumber());
        }
        if (request.getEstimatedDelivery() != null) {
            shipment.setEstimatedDelivery(request.getEstimatedDelivery());
        }
        Shipment saved = shipments.save(shipment);
        recordEvent(saved.getId(), "ShipmentStatusUpdated", "Status set to " + saved.getStatus());
        publishShipmentEvent(saved, "ShipmentStatusUpdated");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ShipmentEvent> history(Long shipmentId) {
        return shipmentEvents.findByShipmentIdOrderByEventTimeDesc(shipmentId);
    }

    private ShipmentStatus parseStatus(String status) {
        try {
            return ShipmentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ShipmentStatus.EXCEPTION;
        }
    }

    private void recordEvent(Long shipmentId, String type, String description) {
        shipmentEvents.save(new ShipmentEvent(shipmentId, type, description, LocalDateTime.now()));
    }

    private void publishShipmentEvent(Shipment shipment, String type) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("shipmentNumber", shipment.getShipmentNumber());
        payload.put("trackingNumber", shipment.getTrackingNumber());
        payload.put("status", shipment.getStatus().name());
        payload.put("orderId", shipment.getOrderId());
        payload.put("customerId", shipment.getCustomerId());
        payload.put("carrier", shipment.getCarrier());
        payload.put("estimatedDelivery", shipment.getEstimatedDelivery());
        kafkaTemplate.send("shipment-events", new SagaEvent(shipment.getOrderId(), type, toJson(payload)));
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
