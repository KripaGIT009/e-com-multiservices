package com.example;

import com.example.common.SagaEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderSaga {

    private final KafkaTemplate<String, SagaEvent> kafka;

    public OrderSaga(KafkaTemplate<String, SagaEvent> kafka) {
        this.kafka = kafka;
    }

    /**
     * Starts the saga. data should be a JSON string carrying order details
     * (e.g. amount and items) so downstream services can act on real values.
     */
    public void start(String orderId, String orderData) {
        kafka.send("order-events", new SagaEvent(orderId, "OrderCreated", orderData));
        kafka.send("payment-command", new SagaEvent(orderId, "ProcessPayment", orderData));
    }

    @KafkaListener(topics = "payment-events")
    public void onPayment(SagaEvent e) {
        if ("PaymentCompleted".equals(e.type())) {
            kafka.send("inventory-command",
                new SagaEvent(e.orderId(), "ReserveInventory", e.data()));
        } else {
            kafka.send("order-events",
                new SagaEvent(e.orderId(), "OrderCancelled", "Payment failed"));
        }
    }

    @KafkaListener(topics = "inventory-events")
    public void onInventory(SagaEvent e) {
        if ("InventoryReserved".equals(e.type())) {
            kafka.send("order-events",
                new SagaEvent(e.orderId(), "OrderCompleted", null));
        } else {
            // Compensate: trigger refund
            kafka.send("payment-command",
                new SagaEvent(e.orderId(), "RefundPayment", e.data()));
            kafka.send("order-events",
                new SagaEvent(e.orderId(), "OrderCancelled", "Inventory failed"));
        }
    }
}
