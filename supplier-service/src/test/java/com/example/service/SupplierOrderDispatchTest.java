package com.example.service;

import com.example.client.OrderClient;
import com.example.dropship.DropshipAdapter;
import com.example.dropship.DropshipAdapterRegistry;
import com.example.dropship.ManualDropshipAdapter;
import com.example.dto.SupplierOrderDtos.DispatchResponse;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.entity.SupplierOrder;
import com.example.event.SupplierOrderEventPublisher;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import com.example.repository.SupplierOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static com.example.service.Fixtures.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SupplierOrderDispatchTest {

    OrderClient orderClient;
    SupplierOrderRepository supplierOrders;
    DropshipPartnerRepository partners;
    DropshipListingRepository listings;
    SupplierOrderEventPublisher events;
    SupplierOrderService service;
    final AtomicLong ids = new AtomicLong();

    @BeforeEach
    void setUp() {
        orderClient = mock(OrderClient.class);
        supplierOrders = mock(SupplierOrderRepository.class);
        partners = mock(DropshipPartnerRepository.class);
        listings = mock(DropshipListingRepository.class);
        events = mock(SupplierOrderEventPublisher.class);
        build(List.of(new ManualDropshipAdapter()));

        when(supplierOrders.saveAndFlush(any())).thenAnswer(inv -> {
            SupplierOrder so = inv.getArgument(0);
            if (so.getId() == null) so.setId(ids.incrementAndGet());
            return so;
        });
        when(supplierOrders.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(supplierOrders.findByOrderIdAndPartnerCode(anyLong(), anyString())).thenReturn(Optional.empty());

        when(partners.findByCode("QIKINK")).thenReturn(Optional.of(partner("QIKINK", "Qikink", true)));
        when(partners.findByCode("EKOMN")).thenReturn(Optional.of(partner("EKOMN", "eKomn", true)));
        when(listings.findByItemId(101L)).thenReturn(Optional.of(listing(101, "QIKINK", "Q-TEE", "250.00")));
        when(listings.findByItemId(102L)).thenReturn(Optional.of(listing(102, "QIKINK", "Q-MUG", "120.50")));
        when(listings.findByItemId(103L)).thenReturn(Optional.of(listing(103, "EKOMN", "E-SAREE", "1200.00")));
    }

    private void build(List<DropshipAdapter> adapters) {
        DropshipAdapterRegistry registry = new DropshipAdapterRegistry(adapters);
        SupplierOrderPlacement placement = new SupplierOrderPlacement(supplierOrders, partners, listings, registry);
        SupplierOrderStatusUpdater updater = new SupplierOrderStatusUpdater(supplierOrders, events);
        service = new SupplierOrderService(orderClient, supplierOrders, placement, updater, events);
    }

    private void givenMixedOrder(String status) {
        when(orderClient.getOrder(7L)).thenReturn(order(7L, status, List.of(
            dropship("101", "Printed Tee", 2, "499.00", "QIKINK"),
            dropship("102", "Mug", 1, "299.00", "QIKINK"),
            dropship("103", "Silk Saree", 1, "1999.00", "EKOMN"),
            firstParty("5", "Own Kettle", 1, "899.00"))));
    }

    @Test
    void unpaidOrderIsRejectedWith409AndNothingIsCreated() {
        givenMixedOrder("PENDING");

        assertThatThrownBy(() -> service.dispatch(7L))
            .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                assertThat(e.getReason()).isEqualTo("Order is not paid");
            });
        verify(supplierOrders, never()).saveAndFlush(any());
    }

    @Test
    void inventoryReservedCountsAsPaid() {
        givenMixedOrder("INVENTORY_RESERVED");
        assertThat(service.dispatch(7L).created()).isEqualTo(2);
    }

    @Test
    void orderWithoutDropshipLinesReturnsEmptyList() {
        when(orderClient.getOrder(8L)).thenReturn(order(8L, "PAYMENT_COMPLETED",
            List.of(firstParty("5", "Own Kettle", 1, "899.00"))));

        DispatchResponse response = service.dispatch(8L);

        assertThat(response.orderId()).isEqualTo(8L);
        assertThat(response.created()).isZero();
        assertThat(response.existing()).isZero();
        assertThat(response.supplierOrders()).isEmpty();
    }

    @Test
    void createsOneSupplierOrderPerPartnerWithCostsLinesAndSnapshot() {
        givenMixedOrder("PAYMENT_COMPLETED");

        DispatchResponse response = service.dispatch(7L);

        assertThat(response.created()).isEqualTo(2);
        assertThat(response.existing()).isZero();
        assertThat(response.supplierOrders()).extracting(SupplierOrderResponse::partnerCode)
            .containsExactly("QIKINK", "EKOMN");

        SupplierOrderResponse qikink = response.supplierOrders().get(0);
        assertThat(qikink.orderId()).isEqualTo(7L);
        assertThat(qikink.orderNumber()).isEqualTo("ORD-7");
        assertThat(qikink.attempts()).isEqualTo(1);
        assertThat(qikink.costTotal()).isEqualByComparingTo("620.50");
        assertThat(qikink.lines()).hasSize(2);
        assertThat(qikink.lines().get(0).partnerSku()).isEqualTo("Q-TEE");
        assertThat(qikink.lines().get(0).unitCost()).isEqualByComparingTo("250.00");
        assertThat(qikink.lines().get(0).unitPrice()).isEqualByComparingTo("499.00");
        assertThat(qikink.lines().get(0).quantity()).isEqualTo(2);
        assertThat(qikink.shipToName()).isEqualTo("Asha Rao");
        assertThat(qikink.shipToLine1()).isEqualTo("12 MG Road");
        assertThat(qikink.shipToCity()).isEqualTo("Bengaluru");
        assertThat(qikink.shipToPostalCode()).isEqualTo("560001");
        assertThat(qikink.shipToPhone()).isEqualTo("9876543210");

        assertThat(response.supplierOrders().get(1).costTotal()).isEqualByComparingTo(new BigDecimal("1200.00"));
        verify(events, times(2)).created(any());
    }

    @Test
    void manualAdapterLeavesOrderAwaitingManualPlacement() {
        givenMixedOrder("PAYMENT_COMPLETED");

        SupplierOrderResponse qikink = service.dispatch(7L).supplierOrders().get(0);

        assertThat(qikink.status()).isEqualTo("AWAITING_MANUAL_PLACEMENT");
        assertThat(qikink.partnerOrderRef()).isNull();
        assertThat(qikink.submittedAt()).isNull();
        assertThat(qikink.lastNote()).isEqualTo(
            "Place this order on the partner's portal, then record their reference here.");
        assertThat(qikink.allowedNextStatuses()).containsExactly("SUBMITTED", "ACCEPTED", "SHIPPED", "CANCELLED");
    }

    @Test
    void secondDispatchReturnsExistingSupplierOrders() {
        givenMixedOrder("PAYMENT_COMPLETED");
        SupplierOrder existingQikink = supplierOrder(1L, com.example.entity.SupplierOrderStatus.AWAITING_MANUAL_PLACEMENT);
        SupplierOrder existingEkomn = supplierOrder(2L, com.example.entity.SupplierOrderStatus.SUBMITTED);
        existingEkomn.setPartnerCode("EKOMN");
        when(supplierOrders.findByOrderIdAndPartnerCode(7L, "QIKINK")).thenReturn(Optional.of(existingQikink));
        when(supplierOrders.findByOrderIdAndPartnerCode(7L, "EKOMN")).thenReturn(Optional.of(existingEkomn));

        DispatchResponse response = service.dispatch(7L);

        assertThat(response.created()).isZero();
        assertThat(response.existing()).isEqualTo(2);
        assertThat(response.supplierOrders()).extracting(SupplierOrderResponse::id).containsExactly(1L, 2L);
        verify(supplierOrders, never()).saveAndFlush(any());
        verify(events, never()).created(any());
    }

    @Test
    void lostUniqueConstraintRaceReloadsTheWinningRow() {
        when(orderClient.getOrder(7L)).thenReturn(order(7L, "PAYMENT_COMPLETED",
            List.of(dropship("101", "Printed Tee", 2, "499.00", "QIKINK"))));
        SupplierOrder winner = supplierOrder(99L, com.example.entity.SupplierOrderStatus.AWAITING_MANUAL_PLACEMENT);
        when(supplierOrders.findByOrderIdAndPartnerCode(7L, "QIKINK"))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(winner));
        doThrow(new DataIntegrityViolationException("uk")).when(supplierOrders).saveAndFlush(any());

        DispatchResponse response = service.dispatch(7L);

        assertThat(response.created()).isZero();
        assertThat(response.existing()).isEqualTo(1);
        assertThat(response.supplierOrders().get(0).id()).isEqualTo(99L);
    }

    @Test
    void lineWithoutListingFailsThatSupplierOrderNamingTheProduct() {
        givenMixedOrder("PAYMENT_COMPLETED");
        when(listings.findByItemId(102L)).thenReturn(Optional.empty());

        DispatchResponse response = service.dispatch(7L);

        SupplierOrderResponse qikink = response.supplierOrders().get(0);
        assertThat(qikink.status()).isEqualTo("FAILED");
        assertThat(qikink.failureReason()).contains("'Mug'");
        assertThat(qikink.costTotal()).isNull();
        assertThat(qikink.lines()).hasSize(2);
        // The other partner is unaffected.
        assertThat(response.supplierOrders().get(1).status()).isEqualTo("AWAITING_MANUAL_PLACEMENT");
    }

    @Test
    void listingWithAnotherPartnerFails() {
        givenMixedOrder("PAYMENT_COMPLETED");
        when(listings.findByItemId(101L)).thenReturn(Optional.of(listing(101, "EKOMN", "E-TEE", "250.00")));

        SupplierOrderResponse qikink = service.dispatch(7L).supplierOrders().get(0);

        assertThat(qikink.status()).isEqualTo("FAILED");
        assertThat(qikink.failureReason()).contains("'Printed Tee'").contains("EKOMN");
    }

    @Test
    void inactivePartnerFailsItsSupplierOrder() {
        givenMixedOrder("PAYMENT_COMPLETED");
        when(partners.findByCode("EKOMN")).thenReturn(Optional.of(partner("EKOMN", "eKomn", false)));

        SupplierOrderResponse ekomn = service.dispatch(7L).supplierOrders().get(1);

        assertThat(ekomn.status()).isEqualTo("FAILED");
        assertThat(ekomn.failureReason()).isEqualTo("Dropship partner eKomn is inactive");
    }

    @Test
    void linesWithoutPartnerCodeAreGroupedUnderUnknownAndFailed() {
        when(orderClient.getOrder(7L)).thenReturn(order(7L, "PAYMENT_COMPLETED",
            List.of(dropship("101", "Printed Tee", 1, "499.00", null))));

        SupplierOrderResponse unknown = service.dispatch(7L).supplierOrders().get(0);

        assertThat(unknown.partnerCode()).isEqualTo("UNKNOWN");
        assertThat(unknown.status()).isEqualTo("FAILED");
        assertThat(unknown.failureReason()).isNotBlank();
    }
}
