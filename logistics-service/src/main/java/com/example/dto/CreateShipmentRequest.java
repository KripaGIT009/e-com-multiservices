package com.example.dto;

import java.time.LocalDateTime;

public class CreateShipmentRequest {
    private String orderId;
    private String customerId;
    private String carrier;
    private String trackingNumber;
    private String deliveryAddress;
    private String carrierTrackingUrl;
    private LocalDateTime estimatedDelivery;

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }
    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getCarrierTrackingUrl() { return carrierTrackingUrl; }
    public void setCarrierTrackingUrl(String carrierTrackingUrl) { this.carrierTrackingUrl = carrierTrackingUrl; }
    public LocalDateTime getEstimatedDelivery() { return estimatedDelivery; }
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) { this.estimatedDelivery = estimatedDelivery; }
}
