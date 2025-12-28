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

    @KafkaListener(topics = "payment-command")
    public void handle(SagaEvent e) {
        if ("ProcessPayment".equals(e.type())) {
            kafka.send("payment-events",
                new SagaEvent(e.orderId(), "PaymentCompleted", null));
        }
        if ("RefundPayment".equals(e.type())) {
            // refund logic
        }
    }
}
