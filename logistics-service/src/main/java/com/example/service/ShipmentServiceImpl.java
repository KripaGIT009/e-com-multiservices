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
public class ShipmentServiceImpl implements IShipmentService {

    private final ShipmentRepository shipments;
    private final ShipmentEventRepository shipmentEvents;
    private final KafkaTemplate<String, SagaEvent> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ShipmentServiceImpl(ShipmentRepository shipments,
                              ShipmentEventRepository shipmentEvents,
                              KafkaTemplate<String, SagaEvent> kafkaTemplate,
                              ObjectMapper objectMapper) {
        this.shipments = shipments;
        this.shipmentEvents = shipmentEvents;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public List<Shipment> getAllShipments() {
        return shipments.findAll();
    }

    public Shipment createShipment(CreateShipmentRequest request) {
        String shipmentNumber = request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()
            ? request.getTrackingNumber()
            : "SHP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String trackingNumber = request.getTrackingNumber() == null || request.getTrackingNumber().isBlank()
            ? shipmentNumber
            : request.getTrackingNumber();
        String customerId = request.getCustomerId() == null || request.getCustomerId().isBlank() ? "UNKNOWN" : request.getCustomerId();

        LocalDateTime eta = request.getEstimatedDelivery() != null
            ? request.getEstimatedDelivery()
            : addBusinessDays(LocalDateTime.now(), 5);

        Shipment shipment = new Shipment(
            shipmentNumber,
            request.getOrderId(),
            customerId,
            ShipmentStatus.ORDER_PLACED,
            request.getCarrier() == null ? "STANDARD" : request.getCarrier(),
            trackingNumber,
            eta
        );
        if (request.getDeliveryAddress() != null) shipment.setDeliveryAddress(request.getDeliveryAddress());
        if (request.getCarrierTrackingUrl() != null) shipment.setCarrierTrackingUrl(request.getCarrierTrackingUrl());
        shipment.setLastStatusNote("Your order has been placed and is being processed.");

        Shipment saved = shipments.save(shipment);
        recordEvent(saved.getId(), "ShipmentCreated", "Order placed - awaiting fulfilment.");
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

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentByShipmentNumber(String shipmentNumber) {
        return shipments.findByShipmentNumber(shipmentNumber);
    }

    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentByTrackingNumber(String trackingNumber) {
        Optional<Shipment> result = shipments.findByTrackingNumber(trackingNumber);
        if (result.isEmpty()) {
            result = shipments.findByShipmentNumber(trackingNumber);
        }
        return result;
    }

    public Shipment updateStatus(Long id, UpdateShipmentStatusRequest request) {
        Shipment shipment = shipments.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + id));

        ShipmentStatus newStatus = null;
        if (request.getStatus() != null) {
            newStatus = parseStatus(request.getStatus());
            shipment.setStatus(newStatus);
        }
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            shipment.setTrackingNumber(request.getTrackingNumber());
        }
        if (request.getCarrier() != null && !request.getCarrier().isBlank()) {
            shipment.setCarrier(request.getCarrier());
        }
        if (request.getCarrierTrackingUrl() != null && !request.getCarrierTrackingUrl().isBlank()) {
            shipment.setCarrierTrackingUrl(request.getCarrierTrackingUrl());
        }
        if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().isBlank()) {
            shipment.setDeliveryAddress(request.getDeliveryAddress());
        }
        if (request.getEstimatedDelivery() != null) {
            shipment.setEstimatedDelivery(request.getEstimatedDelivery());
        }
        String note = request.getNote() != null && !request.getNote().isBlank()
            ? request.getNote()
            : defaultNoteForStatus(newStatus != null ? newStatus : shipment.getStatus());
        shipment.setLastStatusNote(note);

        Shipment saved = shipments.save(shipment);
        recordEvent(saved.getId(), "ShipmentStatusUpdated", note);
        publishShipmentEvent(saved, "ShipmentStatusUpdated");
        return saved;
    }

    public Shipment updateEstimatedDelivery(Long id, LocalDateTime estimatedDelivery) {
        Shipment shipment = shipments.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + id));
        shipment.setEstimatedDelivery(estimatedDelivery);
        Shipment saved = shipments.save(shipment);
        recordEvent(saved.getId(), "ShipmentEtaUpdated", "Estimated delivery updated to " + estimatedDelivery);
        publishShipmentEvent(saved, "ShipmentEtaUpdated");
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

    private String defaultNoteForStatus(ShipmentStatus status) {
        switch (status) {
            case ORDER_PLACED:        return "Your order has been placed and is being processed.";
            case PROCESSING:          return "We are picking and packing your items.";
            case LABEL_GENERATED:     return "Shipping label created - handing over to carrier.";
            case PICKED_UP:           return "Your package has been picked up by the carrier.";
            case IN_TRANSIT:          return "Your package is on its way to you.";
            case OUT_FOR_DELIVERY:    return "Your package is out for delivery today!";
            case ATTEMPTED_DELIVERY:  return "Delivery was attempted. We will try again tomorrow.";
            case DELIVERED:           return "Your package has been delivered. Enjoy!";
            case EXCEPTION:           return "There is an issue with your shipment. Our team is looking into it.";
            case RETURNED:            return "Your package is being returned to us.";
            default:                  return "Shipment status updated.";
        }
    }

    private LocalDateTime addBusinessDays(LocalDateTime from, int days) {
        LocalDateTime result = from;
        int added = 0;
        while (added < days) {
            result = result.plusDays(1);
            int dow = result.getDayOfWeek().getValue();
            if (dow < 6) added++;
        }
        return result.withHour(20).withMinute(0).withSecond(0).withNano(0);
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
        payload.put("lastStatusNote", shipment.getLastStatusNote());
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
