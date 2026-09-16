package com.example.dto;

import com.example.dropship.DropshipAdapter;
import com.example.entity.DropshipListing;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import com.example.dto.ListingDtos.ListingResponse;
import com.example.dto.PartnerDtos.PartnerResponse;
import com.example.dto.SupplierOrderDtos.SupplierOrderLineResponse;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;

import java.util.List;

/** Entity → response DTO. Entities never leave the service layer. */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static PartnerResponse toResponse(DropshipPartner p, DropshipAdapter adapter) {
        return new PartnerResponse(
            p.getId(), p.getCode(), p.getName(), p.getBestFor(), p.getIntegrationPotential(),
            p.getWebsite(), p.getIntegrationType(),
            p.getOnboardingStatus() == null ? null : p.getOnboardingStatus().name(),
            p.getShipsWithOwnLogistics(), p.getWarehousePincode(), p.getContactEmail(), p.getNotes(),
            p.getActive(), p.getCreatedAt(), p.getUpdatedAt(),
            adapter.isConfigured(), adapter.label());
    }

    public static ListingResponse toResponse(DropshipListing l) {
        return new ListingResponse(
            l.getId(), l.getItemId(), l.getPartnerCode(), l.getPartnerSku(), l.getCostPrice(),
            l.getPartnerStock(), l.getLastSyncedAt(), l.getActive(), l.getCreatedAt(), l.getUpdatedAt());
    }

    public static SupplierOrderResponse toResponse(SupplierOrder o) {
        SupplierOrderStatus status = o.getStatus();
        List<SupplierOrderLineResponse> lines = o.getLines().stream()
            .map(l -> new SupplierOrderLineResponse(l.getId(), l.getItemId(), l.getProductName(),
                l.getPartnerSku(), l.getQuantity(), l.getUnitCost(), l.getUnitPrice()))
            .toList();
        List<String> next = status == null ? List.of()
            : status.manualNextStatuses().stream().map(Enum::name).toList();
        return new SupplierOrderResponse(
            o.getId(), o.getOrderId(), o.getOrderNumber(), o.getPartnerCode(),
            status == null ? null : status.name(),
            o.getPartnerOrderRef(), o.getTrackingNumber(), o.getCarrierName(), o.getTrackingUrl(),
            o.getShipToName(), o.getShipToLine1(), o.getShipToLine2(), o.getShipToCity(),
            o.getShipToState(), o.getShipToPostalCode(), o.getShipToPhone(), o.getShipToEmail(),
            o.getCostTotal(), o.getFailureReason(), o.getLastNote(), o.getAttempts(),
            o.getSubmittedAt(), o.getShippedAt(), o.getDeliveredAt(), o.getCreatedAt(), o.getUpdatedAt(),
            lines, next);
    }
}
