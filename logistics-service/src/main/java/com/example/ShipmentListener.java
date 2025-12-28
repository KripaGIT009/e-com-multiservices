package com.example;

import com.example.common.SagaEvent;
import com.example.service.IShipmentService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class ShipmentListener {

    private final IShipmentService shipmentService;

    public ShipmentListener(IShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    @KafkaListener(topics = {"shipment-command", "order-events"}, containerFactory = "sagaEventKafkaListenerContainerFactory")
    public void onEvent(SagaEvent event) {
        if (event == null || event.type() == null) {
            return;
        }
        if ("CreateShipment".equals(event.type())
            || "OrderCompleted".equals(event.type())
            || ("OrderStatusChanged".equals(event.type()) && event.data() != null && event.data().toUpperCase().contains("COMPLETED"))) {
            shipmentService.createFromOrderEvent(event);
        }
    }
}
