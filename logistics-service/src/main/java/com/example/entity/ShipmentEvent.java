package com.example.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_events")
public class ShipmentEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long shipmentId;

    @Column(nullable = false)
    private String eventType;

    @Column(length = 512)
    private String description;

    @Column(nullable = false)
    private LocalDateTime eventTime;

    public ShipmentEvent() {
    }

    public ShipmentEvent(Long shipmentId, String eventType, String description, LocalDateTime eventTime) {
        this.shipmentId = shipmentId;
        this.eventType = eventType;
        this.description = description;
        this.eventTime = eventTime;
    }

    public Long getId() { return id; }
    public Long getShipmentId() { return shipmentId; }
    public void setShipmentId(Long shipmentId) { this.shipmentId = shipmentId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getEventTime() { return eventTime; }
    public void setEventTime(LocalDateTime eventTime) { this.eventTime = eventTime; }
}
