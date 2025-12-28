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

    public void start(String orderId) {
        kafka.send("order-events", new SagaEvent(orderId, "OrderCreated", null));
        kafka.send("payment-command", new SagaEvent(orderId, "ProcessPayment", null));
    }

    @KafkaListener(topics = "payment-events")
    public void onPayment(SagaEvent e) {
        if ("PaymentCompleted".equals(e.type())) {
            kafka.send("inventory-command",
                new SagaEvent(e.orderId(), "ReserveInventory", null));
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
            kafka.send("payment-command",
                new SagaEvent(e.orderId(), "RefundPayment", null));
            kafka.send("order-events",
                new SagaEvent(e.orderId(), "OrderCancelled", "Inventory failed"));
        }
    }
}
