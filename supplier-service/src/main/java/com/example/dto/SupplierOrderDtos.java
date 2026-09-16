package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Wire shapes for supplier orders and dispatch. */
public final class SupplierOrderDtos {

    private SupplierOrderDtos() {
    }

    public record DispatchRequest(@NotNull(message = "orderId is required") Long orderId) {
    }

    public record StatusUpdateRequest(
        @NotBlank(message = "status is required") String status,
        @Size(max = 80, message = "partnerOrderRef is at most 80 characters") String partnerOrderRef,
        @Size(max = 60, message = "trackingNumber is at most 60 characters") String trackingNumber,
        @Size(max = 80, message = "carrierName is at most 80 characters") String carrierName,
        @Size(max = 512, message = "trackingUrl is at most 512 characters") String trackingUrl,
        @Size(max = 500, message = "note is at most 500 characters") String note) {
    }

    public record SupplierOrderLineResponse(
        Long id,
        Long itemId,
        String productName,
        String partnerSku,
        Integer quantity,
        BigDecimal unitCost,
        BigDecimal unitPrice) {
    }

    public record SupplierOrderResponse(
        Long id,
        Long orderId,
        String orderNumber,
        String partnerCode,
        String status,
        String partnerOrderRef,
        String trackingNumber,
        String carrierName,
        String trackingUrl,
        String shipToName,
        String shipToLine1,
        String shipToLine2,
        String shipToCity,
        String shipToState,
        String shipToPostalCode,
        String shipToPhone,
        String shipToEmail,
        BigDecimal costTotal,
        String failureReason,
        String lastNote,
        Integer attempts,
        LocalDateTime submittedAt,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<SupplierOrderLineResponse> lines,
        List<String> allowedNextStatuses) {
    }

    public record DispatchResponse(
        Long orderId,
        int created,
        int existing,
        List<SupplierOrderResponse> supplierOrders) {
    }
}
