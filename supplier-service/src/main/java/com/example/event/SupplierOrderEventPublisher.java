package com.example.event;

import com.example.entity.SupplierOrder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Publishes supplier-order events. Announcing a supplier order is a side effect of
 * placing it, so a broker that is down or missing the topic must never fail the request
 * — the same rule as shipment events in logistics-service.
 */
@Component
public class SupplierOrderEventPublisher {

    public static final String TOPIC = "supplier-order-events";

    private static final Logger log = LoggerFactory.getLogger(SupplierOrderEventPublisher.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public SupplierOrderEventPublisher(KafkaTemplate<String, Object> kafkaTemplate, ObjectMapper objectMapper) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    public void created(SupplierOrder order) {
        publish(order, SupplierOrderEvent.CREATED, null);
    }

    public void statusChanged(SupplierOrder order, String previousStatus) {
        publish(order, SupplierOrderEvent.STATUS_CHANGED, previousStatus);
    }

    private void publish(SupplierOrder order, String type, String previousStatus) {
        SupplierOrderEvent event = buildEvent(order, type, previousStatus);
        if (event == null) return;
        // Inside a transaction, wait for the commit: an event for a row that rolls back
        // would announce something that never happened.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    send(event);
                }
            });
        } else {
            send(event);
        }
    }

    private SupplierOrderEvent buildEvent(SupplierOrder order, String type, String previousStatus) {
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("supplierOrderId", order.getId());
            data.put("orderId", order.getOrderId());
            data.put("orderNumber", order.getOrderNumber());
            data.put("partnerCode", order.getPartnerCode());
            data.put("status", order.getStatus() == null ? null : order.getStatus().name());
            if (previousStatus != null) data.put("previousStatus", previousStatus);
            data.put("partnerOrderRef", order.getPartnerOrderRef());
            data.put("trackingNumber", order.getTrackingNumber());
            data.put("carrierName", order.getCarrierName());
            data.put("failureReason", order.getFailureReason());
            return new SupplierOrderEvent(String.valueOf(order.getOrderId()), type,
                objectMapper.writeValueAsString(data));
        } catch (Exception e) {
            log.error("Could not serialise {} for supplier order {}: {}", type, order.getId(), e.getMessage());
            return null;
        }
    }

    private void send(SupplierOrderEvent event) {
        try {
            kafkaTemplate.send(TOPIC, event.orderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("{} for order {} was not delivered: {}", event.type(), event.orderId(), ex.getMessage());
                    }
                });
        } catch (Exception e) {
            log.error("{} for order {} could not be published: {}", event.type(), event.orderId(), e.getMessage());
        }
    }
}
