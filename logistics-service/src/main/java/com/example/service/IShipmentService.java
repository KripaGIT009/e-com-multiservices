package com.example.service;

import com.example.common.SagaEvent;
import com.example.dto.CreateShipmentRequest;
import com.example.dto.UpdateShipmentStatusRequest;
import com.example.entity.Shipment;
import com.example.entity.ShipmentEvent;
import com.example.domain.ShipmentStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IShipmentService {
    Shipment createShipment(CreateShipmentRequest request);
    Shipment createFromOrderEvent(SagaEvent event);
    Optional<Shipment> getShipment(Long id);
    Optional<Shipment> getShipmentByOrder(String orderId);
    List<Shipment> getShipmentsByShipmentNumber(String shipmentNumber);
    Shipment updateStatus(Long id, UpdateShipmentStatusRequest request);
    Shipment updateEstimatedDelivery(Long id, LocalDateTime estimatedDelivery);
    List<ShipmentEvent> history(Long shipmentId);
}
