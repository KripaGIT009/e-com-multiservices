package com.example.entity;

import com.example.domain.ShipmentStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/*
 * (orderId, fulfilmentKey) is unique so two concurrent bookings of the same group cannot
 * both land (CLAUDE.md rule 7). Shipments recorded before M1 have a NULL key; PostgreSQL
 * treats NULLs as distinct, so adding the constraint to an existing table is safe.
 */
@Entity
@Table(name = "shipments",
       uniqueConstraints = @UniqueConstraint(name = "uk_shipment_order_fulfilment",
                                             columnNames = {"orderId", "fulfilmentKey"}))
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String shipmentNumber;

    @Column(nullable = false)
    private String orderId;

    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ShipmentStatus status = ShipmentStatus.ORDER_PLACED;

    private String carrier;

    @Column(unique = true)
    private String trackingNumber;

    private LocalDateTime estimatedDelivery;

    /** Free-text address line delivered to (e.g. "123 Main St, Mumbai 400001") */
    @Column(length = 512)
    private String deliveryAddress;

    /** Carrier tracking URL template, e.g. https://track.delhivery.com/p/{trackingNumber} */
    @Column(length = 512)
    private String carrierTrackingUrl;

    /** Human-readable last update note shown to customer */
    @Column(length = 512)
    private String lastStatusNote;

    /*
     * M1 booking columns, all nullable: shipments from before M1 have none of them, and a
     * NULL fulfilmentKey means the shipment covers the whole order (§4.1).
     * bookingMode is a varchar (MANUAL / API), not @Enumerated — Hibernate 6's CHECK
     * constraint on enum columns is never widened by ddl-auto update.
     */

    /** Which group of the order this parcel is: FIRST_PARTY, SELLER:3, … */
    @Column(length = 60)
    private String fulfilmentKey;

    @Column(length = 20)
    private String partnerCode;

    @Column(length = 20)
    private String bookingMode;

    @Column(length = 512)
    private String labelUrl;

    /** True when MyIndianStore made the tracking number up; it will not resolve on the carrier's site. */
    private Boolean trackingGenerated;

    /** Why the booking went the way it did, e.g. an API carrier that is not configured yet. */
    @Column(length = 512)
    private String bookingNote;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Shipment() {
    }

    public Shipment(String shipmentNumber, String orderId, String customerId, ShipmentStatus status, String carrier, String trackingNumber, LocalDateTime estimatedDelivery) {
        this.shipmentNumber = shipmentNumber;
        this.orderId = orderId;
        this.customerId = customerId;
        this.status = status == null ? ShipmentStatus.ORDER_PLACED : status;
        this.carrier = carrier;
        this.trackingNumber = trackingNumber;
        this.estimatedDelivery = estimatedDelivery;
    }

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = ShipmentStatus.ORDER_PLACED;
        }
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getShipmentNumber() { return shipmentNumber; }
    public void setShipmentNumber(String shipmentNumber) { this.shipmentNumber = shipmentNumber; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public LocalDateTime getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getCarrierTrackingUrl() { return carrierTrackingUrl; }
    public void setCarrierTrackingUrl(String carrierTrackingUrl) { this.carrierTrackingUrl = carrierTrackingUrl; }
    public String getLastStatusNote() { return lastStatusNote; }
    public void setLastStatusNote(String lastStatusNote) { this.lastStatusNote = lastStatusNote; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getFulfilmentKey() { return fulfilmentKey; }
    public void setFulfilmentKey(String fulfilmentKey) { this.fulfilmentKey = fulfilmentKey; }
    public String getPartnerCode() { return partnerCode; }
    public void setPartnerCode(String partnerCode) { this.partnerCode = partnerCode; }
    public String getBookingMode() { return bookingMode; }
    public void setBookingMode(String bookingMode) { this.bookingMode = bookingMode; }
    public String getLabelUrl() { return labelUrl; }
    public void setLabelUrl(String labelUrl) { this.labelUrl = labelUrl; }
    public Boolean getTrackingGenerated() { return trackingGenerated; }
    public void setTrackingGenerated(Boolean trackingGenerated) { this.trackingGenerated = trackingGenerated; }
    public String getBookingNote() { return bookingNote; }
    public void setBookingNote(String bookingNote) { this.bookingNote = bookingNote; }
}
