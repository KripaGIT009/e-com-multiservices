package com.example.service;

import com.example.dto.ListingDtos.CreateListingRequest;
import com.example.dto.ListingDtos.ListingResponse;
import com.example.dto.ListingDtos.UpdateListingRequest;
import com.example.entity.DropshipListing;
import com.example.repository.DropshipListingRepository;
import com.example.repository.DropshipPartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

import static com.example.service.Fixtures.listing;
import static com.example.service.Fixtures.partner;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ListingServiceTest {

    DropshipListingRepository listings;
    DropshipPartnerRepository partners;
    ListingService service;

    @BeforeEach
    void setUp() {
        listings = mock(DropshipListingRepository.class);
        partners = mock(DropshipPartnerRepository.class);
        service = new ListingService(listings, partners);
        when(partners.findByCode("QIKINK")).thenReturn(Optional.of(partner("QIKINK", "Qikink", true)));
        when(partners.findByCode("EKOMN")).thenReturn(Optional.of(partner("EKOMN", "eKomn", false)));
        when(listings.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static CreateListingRequest create(String partner, String sku, String cost) {
        return new CreateListingRequest(101L, partner, sku, new BigDecimal(cost), 5);
    }

    private static void expect(Runnable call, HttpStatus status) {
        assertThatThrownBy(call::run).isInstanceOfSatisfying(ResponseStatusException.class,
            e -> assertThat(e.getStatusCode()).isEqualTo(status));
    }

    @Test
    void createsListingForActivePartner() {
        ListingResponse r = service.create(create("QIKINK", " Q-TEE ", "250.00"));
        assertThat(r.itemId()).isEqualTo(101L);
        assertThat(r.partnerSku()).isEqualTo("Q-TEE");
        assertThat(r.costPrice()).isEqualByComparingTo("250.00");
        assertThat(r.partnerStock()).isEqualTo(5);
        assertThat(r.active()).isTrue();
    }

    @Test
    void unknownPartnerIs400() {
        expect(() -> service.create(create("NOPE", "X", "10")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void inactivePartnerIs422() {
        expect(() -> service.create(create("EKOMN", "X", "10")), HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void nonPositiveCostPriceIs400() {
        expect(() -> service.create(create("QIKINK", "X", "0")), HttpStatus.BAD_REQUEST);
        expect(() -> service.create(create("QIKINK", "X", "-1.00")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void itemAlreadyLinkedIs409() {
        when(listings.existsByItemId(101L)).thenReturn(true);
        expect(() -> service.create(create("QIKINK", "Q-TEE", "250")), HttpStatus.CONFLICT);
    }

    @Test
    void partnerSkuTakenIs409() {
        when(listings.existsByPartnerCodeAndPartnerSku("QIKINK", "Q-TEE")).thenReturn(true);
        expect(() -> service.create(create("QIKINK", "Q-TEE", "250")), HttpStatus.CONFLICT);
    }

    @Test
    void uniqueConstraintRaceIs409() {
        doThrow(new DataIntegrityViolationException("uk")).when(listings).saveAndFlush(any());
        expect(() -> service.create(create("QIKINK", "Q-TEE", "250")), HttpStatus.CONFLICT);
    }

    @Test
    void updateIsAPatchAndValidatesCost() {
        DropshipListing existing = listing(101, "QIKINK", "Q-TEE", "250.00");
        when(listings.findById(1010L)).thenReturn(Optional.of(existing));

        ListingResponse r = service.update(1010L, new UpdateListingRequest(null, new BigDecimal("199.99"), null, false));
        assertThat(r.partnerSku()).isEqualTo("Q-TEE");
        assertThat(r.costPrice()).isEqualByComparingTo("199.99");
        assertThat(r.active()).isFalse();

        expect(() -> service.update(1010L, new UpdateListingRequest(null, BigDecimal.ZERO, null, null)),
            HttpStatus.BAD_REQUEST);
    }

    @Test
    void unlinkedItemIs404() {
        when(listings.findByItemId(55L)).thenReturn(Optional.empty());
        expect(() -> service.forItem(55L), HttpStatus.NOT_FOUND);
    }
}
