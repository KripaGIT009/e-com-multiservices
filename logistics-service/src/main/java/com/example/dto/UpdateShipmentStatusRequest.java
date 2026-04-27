package com.example.dto;

import java.time.LocalDateTime;

public class UpdateShipmentStatusRequest {
    private String status;
    private String trackingNumber;
    private String carrier;
    private String carrierTrackingUrl;
    private String deliveryAddress;
    private String note;
    private LocalDateTime estimatedDelivery;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getCarrierTrackingUrl() { return carrierTrackingUrl; }
    public void setCarrierTrackingUrl(String carrierTrackingUrl) { this.carrierTrackingUrl = carrierTrackingUrl; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
}
