package com.example.service;

import com.example.carrier.CarrierAdapterRegistry;
import com.example.carrier.ManualCarrierAdapter;
import com.example.dto.DeliveryPartnerRequest;
import com.example.dto.DeliveryPartnerResponse;
import com.example.entity.DeliveryPartner;
import com.example.repository.DeliveryPartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DeliveryPartnerServiceTest {

    private DeliveryPartnerRepository repository;
    private DeliveryPartnerService service;

    @BeforeEach
    void setUp() {
        repository = mock(DeliveryPartnerRepository.class);
        service = new DeliveryPartnerService(repository, new CarrierAdapterRegistry(List.of(new ManualCarrierAdapter())));
        when(repository.findByCode(anyString())).thenReturn(Optional.empty());
        when(repository.save(any(DeliveryPartner.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createDefaultsToManualAndReportsIntegration() {
        DeliveryPartnerResponse r = service.create(request("SHADOWFAX", null, null));
        assertEquals("MANUAL", r.integrationType());
        assertTrue(r.integrationConfigured());
        assertTrue(r.active());
        assertEquals(100, r.priority());
        assertTrue(r.codSupported());
    }

    @Test
    void badCodeIs400() {
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.create(request("shadowfax", null, null)));
        assertStatus(HttpStatus.BAD_REQUEST, () -> service.create(request("A", null, null)));
    }

    @Test
    void duplicateCodeIs409() {
        when(repository.findByCode("DTDC")).thenReturn(Optional.of(new DeliveryPartner()));
        assertStatus(HttpStatus.CONFLICT, () -> service.create(request("DTDC", null, null)));
    }

    @Test
    void unregisteredIntegrationIs400NamingValidKeys() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class,
            () -> service.create(request("SHADOWFAX", "FEDEX", null)));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        assertTrue(e.getReason().contains("MANUAL"), e.getReason());
    }

    @Test
    void putLeavesActiveAloneWhenOmitted() {
        DeliveryPartner stored = new DeliveryPartner("DTDC", "DTDC", null, 4, new BigDecimal("60.00"), "");
        stored.setActive(false);
        when(repository.findById(3L)).thenReturn(Optional.of(stored));

        DeliveryPartnerResponse r = service.update(3L,
            new DeliveryPartnerRequest(null, "DTDC Express", null, null, null, null, null, null, null, 5, null));
        assertFalse(r.active());
        assertEquals("DTDC Express", r.name());
        assertEquals(5, r.priority());
    }

    private static DeliveryPartnerRequest request(String code, String integrationType, Boolean active) {
        return new DeliveryPartnerRequest(code, "Shadowfax", null, 3, new BigDecimal("40.00"), active,
            null, integrationType, null, null, null);
    }

    private static void assertStatus(HttpStatus status, org.junit.jupiter.api.function.Executable call) {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, call);
        assertEquals(status, e.getStatusCode());
    }
}
