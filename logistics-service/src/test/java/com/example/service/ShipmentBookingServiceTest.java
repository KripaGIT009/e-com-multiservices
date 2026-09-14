package com.example.service;

import com.example.carrier.*;
import com.example.dto.BookShipmentRequest;
import com.example.dto.ShipmentBookingResponse;
import com.example.entity.DeliveryPartner;
import com.example.entity.Shipment;
import com.example.repository.DeliveryPartnerRepository;
import com.example.repository.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ShipmentBookingServiceTest {

    /** Stands in for an API carrier adapter; configured and failure are switchable. */
    static class FakeApiAdapter implements CarrierAdapter {
        boolean configured = true;
        boolean fail = false;
        BookingRequest lastRequest;

        public String key() { return "DELHIVERY"; }
        public String label() { return "Delhivery API"; }
        public boolean isConfigured() { return configured; }
        public Set<CarrierCapability> capabilities() { return Set.of(CarrierCapability.BOOKING); }
        public List<String> requiredEnvironment() { return List.of("DELHIVERY_API_TOKEN"); }
        public BookingResult book(BookingRequest request) {
            lastRequest = request;
            if (fail) throw new CarrierException("Delhivery rejected the pincode");
            return new BookingResult("AWB123", false, "https://label/1.pdf", "REF1", null);
        }
    }

    private ShipmentRepository shipments;
    private DeliveryPartnerRepository partners;
    private ShipmentEventPublisher events;
    private FakeApiAdapter api;
    private ShipmentBookingService service;
    private DeliveryPartner delhivery;
    private DeliveryPartner dtdc;

    @BeforeEach
    void setUp() {
        shipments = mock(ShipmentRepository.class);
        partners = mock(DeliveryPartnerRepository.class);
        events = mock(ShipmentEventPublisher.class);
        api = new FakeApiAdapter();
        CarrierAdapterRegistry registry = new CarrierAdapterRegistry(List.of(new ManualCarrierAdapter(), api));
        service = new ShipmentBookingService(shipments, partners, registry, events, 500);

        delhivery = new DeliveryPartner("DELHIVERY", "Delhivery", "https://d/{trackingNumber}", 3,
            new BigDecimal("55.00"), "");
        delhivery.setIntegrationType("DELHIVERY");
        dtdc = new DeliveryPartner("DTDC", "DTDC", "https://dtdc/{trackingNumber}", 4, new BigDecimal("60.00"), "");
        dtdc.setIntegrationType("MANUAL");
        when(partners.findByCode("DELHIVERY")).thenReturn(Optional.of(delhivery));
        when(partners.findByCode("DTDC")).thenReturn(Optional.of(dtdc));
        when(shipments.findByOrderIdAndFulfilmentKey(anyString(), anyString())).thenReturn(Optional.empty());
        when(shipments.save(any(Shipment.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void firstBookingWithConfiguredApiAdapter() {
        ShipmentBookingResponse r = service.book(request("DELHIVERY", null, null));

        assertFalse(r.alreadyBooked());
        assertEquals("API", r.bookingMode());
        assertEquals("AWB123", r.trackingNumber());
        assertEquals("https://label/1.pdf", r.labelUrl());
        assertEquals("https://d/AWB123", r.carrierTrackingUrl());
        assertEquals("Delhivery", r.carrier());
        assertEquals("SELLER:3", r.fulfilmentKey());
        assertEquals("DELHIVERY", r.partnerCode());
        assertFalse(r.trackingGenerated());
        assertEquals(500, r.weightGramsUsed());
        assertEquals(500, api.lastRequest.weightGrams());
        verify(shipments).save(any(Shipment.class));
        verify(events).publish(any(Shipment.class), eq("ShipmentBooked"));
        verify(events).recordEvent(any(), eq("ShipmentBooked"), anyString());
    }

    @Test
    void repeatReturnsExistingShipmentAsAlreadyBooked() {
        Shipment existing = new Shipment("SHP-1", "34", "6", null, "Delhivery", "AWB1", null);
        existing.setFulfilmentKey("SELLER:3");
        when(shipments.findByOrderIdAndFulfilmentKey("34", "SELLER:3")).thenReturn(Optional.of(existing));

        ShipmentBookingResponse r = service.book(request("DELHIVERY", null, null));

        assertTrue(r.alreadyBooked());
        assertEquals("AWB1", r.trackingNumber());
        assertNull(api.lastRequest);
        verify(shipments, never()).save(any());
    }

    @Test
    void inactivePartnerIs422() {
        delhivery.setActive(false);
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
            () -> service.book(request("DELHIVERY", null, null)));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, e.getStatusCode());
        verify(shipments, never()).save(any());
    }

    @Test
    void unknownPartnerIs422() {
        when(partners.findByCode("NOPE")).thenReturn(Optional.empty());
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
            () -> service.book(request("NOPE", null, null)));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, e.getStatusCode());
    }

    @Test
    void missingRequiredFieldsAre400() {
        BookShipmentRequest noKey = new BookShipmentRequest("34", "6", " ", "DELHIVERY",
            null, null, null, null, null, null, false, null, null);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.book(noKey));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
    }

    @Test
    void unconfiguredApiAdapterBooksManuallyWithNote() {
        api.configured = false;
        ShipmentBookingResponse r = service.book(request("DELHIVERY", 1200, null));

        assertEquals("MANUAL", r.bookingMode());
        assertTrue(r.trackingGenerated());
        assertTrue(r.bookingNote().startsWith(
            "Delhivery integration not configured (DELHIVERY_API_TOKEN) — booked manually"), r.bookingNote());
        assertEquals(1200, r.weightGramsUsed());
        assertNull(api.lastRequest);
    }

    @Test
    void manualPartnerHonoursSuppliedTrackingNumber() {
        ShipmentBookingResponse r = service.book(request("DTDC", null, "DT998877"));
        assertEquals("MANUAL", r.bookingMode());
        assertEquals("DT998877", r.trackingNumber());
        assertFalse(r.trackingGenerated());
    }

    @Test
    void configuredAdapterFailureThrowsAndSavesNothing() {
        api.fail = true;
        CarrierException e = assertThrows(CarrierException.class, () -> service.book(request("DELHIVERY", null, null)));
        assertEquals("Delhivery rejected the pincode", e.getMessage());
        verify(shipments, never()).save(any());
        verifyNoInteractions(events);
    }

    private static BookShipmentRequest request(String partner, Integer weight, String tracking) {
        return new BookShipmentRequest("34", "6", "SELLER:3", partner,
            "88 MG Road, Bengaluru, Karnataka - 560038", "560038", "Priya Sharma", "9876543299",
            "221001", weight, false, new BigDecimal("1299.00"), tracking);
    }
}
