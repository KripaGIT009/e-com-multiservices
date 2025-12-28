package com.example;

import com.example.common.SagaEvent;
import com.example.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class NotificationListener {

    private final NotificationService notificationService;

    public NotificationListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = {"order-events", "shipment-events", "notification-command"}, containerFactory = "sagaEventKafkaListenerContainerFactory")
    public void onEvent(SagaEvent event) {
        if (event == null || event.type() == null) {
            return;
        }
        notificationService.recordFromSaga(event);
    }
}
