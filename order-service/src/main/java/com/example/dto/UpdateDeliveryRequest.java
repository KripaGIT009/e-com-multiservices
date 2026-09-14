package com.example.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * The courier an order is actually being handed to.
 *
 * A partner is provisionally assigned at checkout, but the seller may hand the
 * parcel to a different one when they ship it. This carries that decision back
 * so the order — and therefore what the customer is shown — matches the shipment.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDeliveryRequest {
    private String deliveryPartnerCode;
    private String deliveryPartnerName;
    private LocalDateTime expectedDelivery;
    /** MANUAL / RULE / DEFAULT / STRATEGY / NONE. Changed only when supplied. */
    private String deliveryAssignmentReason;
}
