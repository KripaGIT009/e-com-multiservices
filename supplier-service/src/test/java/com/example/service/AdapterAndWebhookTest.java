package com.example.service;

import com.example.dropship.*;
import com.example.dto.SupplierOrderDtos.SupplierOrderResponse;
import com.example.entity.DropshipPartner;
import com.example.entity.SupplierOrder;
import com.example.entity.SupplierOrderStatus;
import com.example.event.SupplierOrderEventPublisher;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import com.example.repository.SupplierOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.function.Function;

import static com.example.service.Fixtures.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdapterAndWebhookTest {

    SupplierOrderRepository supplierOrders = mock(SupplierOrderRepository.class);
    DropshipPartnerRepository partners = mock(DropshipPartnerRepository.class);
    DropshipListingRepository listings = mock(DropshipListingRepository.class);
    SupplierOrderEventPublisher events = mock(SupplierOrderEventPublisher.class);

    /** A test double for an API partner; the behaviour of submit is supplied per test. */
    static final class FakeAdapter implements DropshipAdapter {
        boolean configured = true;
        Set<DropshipCapability> caps = EnumSet.of(DropshipCapability.ORDER_SUBMISSION);
        Function<SupplierOrder, SubmissionResult> onSubmit =
            so -> new SubmissionResult("API", "FK-1", SupplierOrderStatus.SUBMITTED, "Accepted by API");
        Optional<WebhookEvent> webhook = Optional.empty();

        public String key() { return "FAKE"; }
        public String label() { return "Fake API"; }
        public boolean isConfigured() { return configured; }
        public Set<DropshipCapability> capabilities() { return caps; }
        public List<String> requiredEnvironment() { return List.of("FAKE_API_KEY"); }
        public SubmissionResult submit(SupplierOrder order, DropshipPartner partner) { return onSubmit.apply(order); }
        public Optional<WebhookEvent> parseWebhook(Map<String, String> headers, byte[] body) { return webhook; }
    }

    FakeAdapter fake = new FakeAdapter();
    SupplierOrderPlacement placement;
    WebhookService webhooks;
    DropshipPartner qikink = partner("QIKINK", "Qikink", true);

    @BeforeEach
    void setUp() {
        DropshipAdapterRegistry registry = new DropshipAdapterRegistry(List.of(new ManualDropshipAdapter(), fake));
        placement = new SupplierOrderPlacement(supplierOrders, partners, listings, registry);
        webhooks = new WebhookService(partners, supplierOrders, registry, new SupplierOrderStatusUpdater(supplierOrders, events));
        qikink.setIntegrationType("FAKE");
        when(partners.findByCode("QIKINK")).thenReturn(Optional.of(qikink));
        when(listings.findByItemId(101L)).thenReturn(Optional.of(listing(101, "QIKINK", "Q-TEE", "250.00")));
        when(supplierOrders.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private SupplierOrder submitted() {
        SupplierOrder so = supplierOrder(1L, SupplierOrderStatus.CREATED);
        return placement.resolveAndSubmit(so);
    }

    @Test
    void configuredApiAdapterSubmitsAndRecordsReference() {
        SupplierOrder so = submitted();
        assertThat(so.getStatus()).isEqualTo(SupplierOrderStatus.SUBMITTED);
        assertThat(so.getPartnerOrderRef()).isEqualTo("FK-1");
        assertThat(so.getSubmittedAt()).isNotNull();
    }

    @Test
    void unconfiguredAdapterFallsBackToManualAndSaysSo() {
        fake.configured = false;
        SupplierOrder so = submitted();
        assertThat(so.getStatus()).isEqualTo(SupplierOrderStatus.AWAITING_MANUAL_PLACEMENT);
        assertThat(so.getLastNote()).contains("Fake API integration is not configured").contains("FAKE_API_KEY");
        assertThat(so.getPartnerOrderRef()).isNull();
    }

    @Test
    void adapterFailureMarksFailedWithItsMessageAndInventsNothing() {
        fake.onSubmit = o -> { throw new DropshipException("Partner rejected SKU Q-TEE"); };
        SupplierOrder so = submitted();
        assertThat(so.getStatus()).isEqualTo(SupplierOrderStatus.FAILED);
        assertThat(so.getFailureReason()).isEqualTo("Partner rejected SKU Q-TEE");
        assertThat(so.getPartnerOrderRef()).isNull();
    }

    @Test
    void webhookForUnknownPartnerIs404() {
        when(partners.findByCode("NOPE")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> webhooks.handle("NOPE", Map.of(), new byte[0]))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void webhookForPartnerWithoutWebhookSupportIs404() {
        assertThatThrownBy(() -> webhooks.handle("QIKINK", Map.of(), "{}".getBytes()))
            .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                assertThat(e.getReason()).isEqualTo("Qikink has no webhook integration");
            });
    }

    @Test
    void webhookAppliesStatusThroughTheStatusMachine() {
        fake.caps = EnumSet.of(DropshipCapability.ORDER_SUBMISSION, DropshipCapability.WEBHOOKS);
        fake.webhook = Optional.of(new WebhookEvent("FK-1", SupplierOrderStatus.SHIPPED, "AWB9", "Blue Dart", null));
        SupplierOrder so = supplierOrder(1L, SupplierOrderStatus.SUBMITTED);
        so.setPartnerOrderRef("FK-1");
        when(supplierOrders.findFirstByPartnerCodeAndPartnerOrderRef("QIKINK", "FK-1")).thenReturn(Optional.of(so));

        SupplierOrderResponse r = webhooks.handle("QIKINK", Map.of(), "{}".getBytes());

        assertThat(r.status()).isEqualTo("SHIPPED");
        assertThat(r.trackingNumber()).isEqualTo("AWB9");
        assertThat(r.carrierName()).isEqualTo("Blue Dart");
    }

    @Test
    void webhookWithIllegalTransitionIs409() {
        fake.caps = EnumSet.of(DropshipCapability.WEBHOOKS);
        fake.webhook = Optional.of(new WebhookEvent("FK-1", SupplierOrderStatus.ACCEPTED, null, null, null));
        SupplierOrder so = supplierOrder(1L, SupplierOrderStatus.DELIVERED);
        when(supplierOrders.findFirstByPartnerCodeAndPartnerOrderRef("QIKINK", "FK-1")).thenReturn(Optional.of(so));

        assertThatThrownBy(() -> webhooks.handle("QIKINK", Map.of(), "{}".getBytes()))
            .isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }
}
