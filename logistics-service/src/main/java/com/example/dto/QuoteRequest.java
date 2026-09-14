package com.example.dto;

/**
 * Body of POST /api/courier-allocation/quote (§6.1, §9.3).
 *
 * @param fulfilmentModel      FIRST_PARTY / SELLER / DROPSHIP; null is FIRST_PARTY
 * @param preferredPartnerCode the manual choice, honoured only if it is a candidate and
 *                             the model allows overrides
 */
public record QuoteRequest(
        String fulfilmentModel,
        String deliveryPincode,
        String deliveryState,
        String pickupPincode,
        Boolean cod,
        String preferredPartnerCode
) { }
