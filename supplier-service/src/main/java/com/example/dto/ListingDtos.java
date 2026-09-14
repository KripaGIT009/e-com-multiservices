package com.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Wire shapes for dropship listings. costPrice ≤ 0 is rejected by the service. */
public final class ListingDtos {

    private ListingDtos() {
    }

    public record CreateListingRequest(
        @NotNull(message = "itemId is required") Long itemId,
        @NotBlank(message = "partnerCode is required") String partnerCode,
        @NotBlank(message = "partnerSku is required")
        @Size(max = 80, message = "partnerSku is at most 80 characters") String partnerSku,
        @NotNull(message = "costPrice is required") BigDecimal costPrice,
        @PositiveOrZero(message = "partnerStock cannot be negative") Integer partnerStock) {
    }

    /** A null field is left unchanged. */
    public record UpdateListingRequest(
        @Size(min = 1, max = 80, message = "partnerSku must be 1-80 characters") String partnerSku,
        BigDecimal costPrice,
        @PositiveOrZero(message = "partnerStock cannot be negative") Integer partnerStock,
        Boolean active) {
    }

    public record ListingResponse(
        Long id,
        Long itemId,
        String partnerCode,
        String partnerSku,
        BigDecimal costPrice,
        Integer partnerStock,
        LocalDateTime lastSyncedAt,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
    }
}
