package com.example.repository;

import com.example.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    /*
     * There is deliberately no Optional findByOrderId: since M1 an order has one shipment
     * per fulfilment group, and a single-result query throws once there are two.
     */
    Optional<Shipment> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);
    List<Shipment> findByOrderIdOrderByCreatedAtDesc(String orderId);
    Optional<Shipment> findByOrderIdAndFulfilmentKey(String orderId, String fulfilmentKey);
    Optional<Shipment> findByShipmentNumber(String shipmentNumber);
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    List<Shipment> findByCustomerId(String customerId);
}
