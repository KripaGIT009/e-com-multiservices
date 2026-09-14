package com.example.service;

import com.example.client.OrderClient;
import com.example.dropship.DropshipAdapterRegistry;
import com.example.dropship.ManualDropshipAdapter;
import com.example.dto.SupplierOrderDtos.StatusUpdateRequest;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import com.example.event.SupplierOrderEventPublisher;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import com.example.repository.SupplierOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static com.example.service.Fixtures.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class SupplierOrderLifecycleTest {

    SupplierOrderRepository supplierOrders;
    DropshipPartnerRepository partners;
    DropshipListingRepository listings;
    SupplierOrderEventPublisher events;
    SupplierOrderService service;

    @BeforeEach
    void setUp() {
        supplierOrders = mock(SupplierOrderRepository.class);
        partners = mock(DropshipPartnerRepository.class);
        listings = mock(DropshipListingRepository.class);
        events = mock(SupplierOrderEventPublisher.class);
        DropshipAdapterRegistry registry = new DropshipAdapterRegistry(List.of(new ManualDropshipAdapter()));
        SupplierOrderPlacement placement = new SupplierOrderPlacement(supplierOrders, partners, listings, registry);
        SupplierOrderStatusUpdater updater = new SupplierOrderStatusUpdater(supplierOrders, events);
        service = new SupplierOrderService(mock(OrderClient.class), supplierOrders, placement, updater, events);
        when(supplierOrders.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private SupplierOrder stored(SupplierOrderStatus status) {
        SupplierOrder so = supplierOrder(1L, status);
        when(supplierOrders.findById(1L)).thenReturn(Optional.of(so));
        return so;
    }

    private static StatusUpdateRequest request(String status, String tracking) {
        return new StatusUpdateRequest(status, null, tracking, null, null, null);
    }

    private static void assertStatus(Runnable call, HttpStatus expected, String reasonFragment) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(ResponseStatusException.class, e -> {
            assertThat(e.getStatusCode()).isEqualTo(expected);
            assertThat(e.getReason()).contains(reasonFragment);
        });
    }

    @Test
    void shippedWithTrackingSetsShippedAtAndPublishes() {
        stored(SupplierOrderStatus.AWAITING_MANUAL_PLACEMENT);

        SupplierOrderResponse r = service.updateStatus(1L,
            new StatusUpdateRequest("SHIPPED", "QK-555", "AWB123", "Delhivery", "https://t.example/AWB123", "Placed"));

        assertThat(r.status()).isEqualTo("SHIPPED");
        assertThat(r.partnerOrderRef()).isEqualTo("QK-555");
        assertThat(r.trackingNumber()).isEqualTo("AWB123");
        assertThat(r.carrierName()).isEqualTo("Delhivery");
        assertThat(r.trackingUrl()).isEqualTo("https://t.example/AWB123");
        assertThat(r.lastNote()).isEqualTo("Placed");
        assertThat(r.shippedAt()).isNotNull();
        verify(events).statusChanged(any(), eq("AWAITING_MANUAL_PLACEMENT"));
    }

    @Test
    void shippedWithoutTrackingIs400() {
        stored(SupplierOrderStatus.ACCEPTED);
        assertStatus(() -> service.updateStatus(1L, request("SHIPPED", " ")), HttpStatus.BAD_REQUEST, "tracking number");
        verify(supplierOrders, never()).save(any());
    }

    @Test
    void deliveredSetsDeliveredAt() {
        SupplierOrder so = stored(SupplierOrderStatus.SHIPPED);
        so.setTrackingNumber("AWB1");
        assertThat(service.updateStatus(1L, request("DELIVERED", null)).deliveredAt()).isNotNull();
    }

    @Test
    void illegalTransitionIs409WithBothStatusesNamed() {
        stored(SupplierOrderStatus.DELIVERED);
        assertStatus(() -> service.updateStatus(1L, request("CANCELLED", null)),
            HttpStatus.CONFLICT, "Cannot move from DELIVERED to CANCELLED");
    }

    @Test
    void failedCannotBeMovedToCreatedByStatusUpdate() {
        stored(SupplierOrderStatus.FAILED);
        assertStatus(() -> service.updateStatus(1L, request("CREATED", null)), HttpStatus.CONFLICT, "use retry");
    }

    @Test
    void unknownStatusIs400() {
        stored(SupplierOrderStatus.SUBMITTED);
        assertStatus(() -> service.updateStatus(1L, request("LOST", null)), HttpStatus.BAD_REQUEST, "LOST");
    }

    @ParameterizedTest
    @EnumSource(value = SupplierOrderStatus.class, names = "FAILED", mode = EnumSource.Mode.EXCLUDE)
    void retryIsOnlyAllowedFromFailed(SupplierOrderStatus status) {
        stored(status);
        assertStatus(() -> service.retry(1L), HttpStatus.CONFLICT, "Only a FAILED supplier order can be retried");
    }

    @Test
    void retryReCostsAndResubmitsAndCountsTheAttempt() {
        SupplierOrder so = stored(SupplierOrderStatus.FAILED);
        so.setFailureReason("No active dropship listing for 'Printed Tee' (item 101)");
        when(partners.findByCode("QIKINK")).thenReturn(Optional.of(partner("QIKINK", "Qikink", true)));
        when(listings.findByItemId(101L)).thenReturn(Optional.of(listing(101, "QIKINK", "Q-TEE", "250.00")));

        SupplierOrderResponse r = service.retry(1L);

        assertThat(r.status()).isEqualTo("AWAITING_MANUAL_PLACEMENT");
        assertThat(r.attempts()).isEqualTo(2);
        assertThat(r.failureReason()).isNull();
        assertThat(r.costTotal()).isEqualByComparingTo("500.00");
        assertThat(r.lines().get(0).partnerSku()).isEqualTo("Q-TEE");
        verify(events).statusChanged(any(), eq("FAILED"));
    }

    @Test
    void retryThatStillLacksAListingStaysFailed() {
        stored(SupplierOrderStatus.FAILED);
        when(partners.findByCode("QIKINK")).thenReturn(Optional.of(partner("QIKINK", "Qikink", true)));
        when(listings.findByItemId(101L)).thenReturn(Optional.empty());

        SupplierOrderResponse r = service.retry(1L);

        assertThat(r.status()).isEqualTo("FAILED");
        assertThat(r.attempts()).isEqualTo(2);
        assertThat(r.failureReason()).contains("'Printed Tee'");
    }

    @Test
    void unknownSupplierOrderIs404() {
        when(supplierOrders.findById(5L)).thenReturn(Optional.empty());
        assertStatus(() -> service.get(5L), HttpStatus.NOT_FOUND, "5");
    }
}
