package com.example;

import com.example.common.SagaEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class PaymentListener {

    private final KafkaTemplate<String, SagaEvent> kafka;

    public PaymentListener(KafkaTemplate<String, SagaEvent> kafka) {
        this.kafka = kafka;
    }

    @KafkaListener(topics = "payment-command", containerFactory = "kafkaListenerContainerFactory")
    public void handle(SagaEvent e) {
        if ("ProcessPayment".equals(e.type())) {
            // TODO: integrate real payment gateway; stub always succeeds
            kafka.send("payment-events",
                new SagaEvent(e.orderId(), "PaymentCompleted", e.data()));
        } else if ("RefundPayment".equals(e.type())) {
            // TODO: integrate real refund logic
            kafka.send("payment-events",
                new SagaEvent(e.orderId(), "PaymentRefunded", e.data()));
        }
    }
}
