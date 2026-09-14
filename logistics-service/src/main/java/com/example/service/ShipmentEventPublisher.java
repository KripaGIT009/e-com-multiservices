package com.example.service;

import com.example.common.SagaEvent;
import com.example.entity.Shipment;
import com.example.entity.ShipmentEvent;
import com.example.repository.ShipmentEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Records a shipment's history row and announces the change on Kafka. Shared by the
 * legacy shipment endpoints and M1 booking so both emit the same payload.
 */
@Component
public class ShipmentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ShipmentEventPublisher.class);

    private final ShipmentEventRepository shipmentEvents;
    private final KafkaTemplate<String, SagaEvent> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public ShipmentEventPublisher(ShipmentEventRepository shipmentEvents,
                                  KafkaTemplate<String, SagaEvent> kafkaTemplate,
                                  ObjectMapper objectMapper) {
        this.shipmentEvents = shipmentEvents;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void recordEvent(Long shipmentId, String type, String description) {
        shipmentEvents.save(new ShipmentEvent(shipmentId, type, description, LocalDateTime.now()));
    }

    public void publish(Shipment shipment, String type) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("shipmentNumber", shipment.getShipmentNumber());
        payload.put("trackingNumber", shipment.getTrackingNumber());
        payload.put("status", shipment.getStatus().name());
        payload.put("orderId", shipment.getOrderId());
        payload.put("customerId", shipment.getCustomerId());
        payload.put("carrier", shipment.getCarrier());
        payload.put("estimatedDelivery", shipment.getEstimatedDelivery());
        payload.put("lastStatusNote", shipment.getLastStatusNote());
        // Consumers need the group to tell which part of a multi-group order moved (§4.1).
        payload.put("fulfilmentKey", shipment.getFulfilmentKey());
        payload.put("partnerCode", shipment.getPartnerCode());
        payload.put("bookingMode", shipment.getBookingMode());
        // The shipment is already persisted. Announcing it is a side effect, so a
        // broker that is down or missing the topic must not fail the hand-off —
        // it previously blocked the request and threw, losing the shipment entirely.
        try {
            kafkaTemplate.send("shipment-events", new SagaEvent(shipment.getOrderId(), type, toJson(payload)));
        } catch (Exception e) {
            log.error("Shipment {} saved but the {} event could not be published: {}",
                    shipment.getShipmentNumber(), type, e.getMessage());
        }
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
