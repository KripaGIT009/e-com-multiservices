package com.example.repository;

import com.example.entity.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {
    List<ShipmentEvent> findByShipmentIdOrderByEventTimeDesc(Long shipmentId);
}
