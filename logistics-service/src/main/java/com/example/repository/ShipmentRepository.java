package com.example.repository;

import com.example.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderId(String orderId);
    Optional<Shipment> findByShipmentNumber(String shipmentNumber);
}
