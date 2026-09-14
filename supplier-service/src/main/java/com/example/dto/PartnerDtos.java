package com.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** Wire shapes for dropship partners and adapter integrations. */
public final class PartnerDtos {

    private PartnerDtos() {
    }

    public record CreatePartnerRequest(
        @NotBlank(message = "code is required")
        @Pattern(regexp = "^[A-Z0-9_]{2,30}$",
                 message = "code must be 2-30 characters of A-Z, 0-9 or _")
        String code,
        @NotBlank(message = "name is required") @Size(max = 120, message = "name is at most 120 characters")
        String name,
        @Size(max = 200, message = "bestFor is at most 200 characters") String bestFor,
        @Size(max = 80, message = "integrationPotential is at most 80 characters") String integrationPotential,
        @Size(max = 200, message = "website is at most 200 characters") String website,
        String integrationType,
        String onboardingStatus,
        Boolean shipsWithOwnLogistics,
        @Pattern(regexp = "^\\d{6}$", message = "warehousePincode must be 6 digits") String warehousePincode,
        @Email(message = "contactEmail must be an email address")
        @Size(max = 160, message = "contactEmail is at most 160 characters") String contactEmail,
        @Size(max = 1000, message = "notes is at most 1000 characters") String notes,
        Boolean active) {
    }

    /** PUT is a patch: a null field is left unchanged. */
    public record UpdatePartnerRequest(
        @Size(min = 1, max = 120, message = "name must be 1-120 characters") String name,
        @Size(max = 200, message = "bestFor is at most 200 characters") String bestFor,
        @Size(max = 80, message = "integrationPotential is at most 80 characters") String integrationPotential,
        @Size(max = 200, message = "website is at most 200 characters") String website,
        String integrationType,
        String onboardingStatus,
        Boolean shipsWithOwnLogistics,
        @Pattern(regexp = "^(\\d{6})?$", message = "warehousePincode must be 6 digits") String warehousePincode,
        @Email(message = "contactEmail must be an email address")
        @Size(max = 160, message = "contactEmail is at most 160 characters") String contactEmail,
        @Size(max = 1000, message = "notes is at most 1000 characters") String notes,
        Boolean active) {
    }

    public record PartnerResponse(
        Long id,
        String code,
        String name,
        String bestFor,
        String integrationPotential,
        String website,
        String integrationType,
        String onboardingStatus,
        Boolean shipsWithOwnLogistics,
        String warehousePincode,
        String contactEmail,
        String notes,
        Boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean integrationConfigured,
        String integrationLabel) {
    }

    public record IntegrationResponse(
        String key,
        String label,
        boolean configured,
        List<String> capabilities,
        List<String> requiredEnvironment) {
    }
}
