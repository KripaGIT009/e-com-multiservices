package com.example.service;

import com.example.entity.FulfilmentModel;
import com.example.entity.Item;
import com.example.repository.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ItemServiceImplTest {

    @Mock
    private ItemRepository itemRepository;

    private ItemServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ItemServiceImpl(itemRepository);
        lenient().when(itemRepository.save(any(Item.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static Item item(Long sellerId, String model, String partnerCode) {
        Item item = new Item("SKU-1", "Kurta", "Cotton", new BigDecimal("499.00"), 10, "CLOTHING");
        item.setSellerId(sellerId);
        item.setFulfilmentModel(model);
        item.setFulfilmentPartnerCode(partnerCode);
        return item;
    }

    private static void assertBadRequest(Runnable call, String messageFragment) {
        assertThatThrownBy(call::run)
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(rse.getReason()).contains(messageFragment);
                });
    }

    // --- create: derivation --------------------------------------------------------

    @Test
    void createDerivesSellerWhenModelAbsentAndSellerIdPresent() {
        Item saved = service.createItem(item(7L, null, null));
        assertThat(saved.getFulfilmentModel()).isEqualTo("SELLER");
    }

    @Test
    void createDerivesFirstPartyWhenModelAndSellerIdAbsent() {
        Item saved = service.createItem(item(null, null, null));
        assertThat(saved.getFulfilmentModel()).isEqualTo("FIRST_PARTY");
    }

    @Test
    void createNormalisesPartnerCode() {
        Item saved = service.createItem(item(null, "dropship", "  qikink "));
        assertThat(saved.getFulfilmentModel()).isEqualTo("DROPSHIP");
        assertThat(saved.getFulfilmentPartnerCode()).isEqualTo("QIKINK");
    }

    // --- create: validation --------------------------------------------------------

    @Test
    void createRejectsUnknownModel() {
        assertBadRequest(() -> service.createItem(item(null, "CONSIGNMENT", null)), "Unknown fulfilmentModel");
        verify(itemRepository, never()).save(any());
    }

    @Test
    void createRejectsSellerWithoutSellerId() {
        assertBadRequest(() -> service.createItem(item(null, "SELLER", null)), "SELLER items require a sellerId");
    }

    @Test
    void createRejectsFirstPartyWithSellerId() {
        assertBadRequest(() -> service.createItem(item(7L, "FIRST_PARTY", null)), "cannot have a sellerId");
    }

    @Test
    void createRejectsDropshipWithSellerId() {
        assertBadRequest(() -> service.createItem(item(7L, "DROPSHIP", "QIKINK")), "cannot have a sellerId");
    }

    @Test
    void createRejectsDropshipWithoutPartnerCode() {
        assertBadRequest(() -> service.createItem(item(null, "DROPSHIP", "  ")), "require a fulfilmentPartnerCode");
    }

    @Test
    void createRejectsPartnerCodeOnNonDropship() {
        assertBadRequest(() -> service.createItem(item(7L, null, "QIKINK")), "only allowed on DROPSHIP");
        assertBadRequest(() -> service.createItem(item(null, "FIRST_PARTY", "QIKINK")), "only allowed on DROPSHIP");
    }

    @Test
    void createRejectsOverlongPartnerCode() {
        assertBadRequest(() -> service.createItem(item(null, "DROPSHIP", "X".repeat(41))), "at most 40");
    }

    // --- legacy rows ---------------------------------------------------------------

    @Test
    void legacyNullModelResolvesFromSellerId() {
        assertThat(item(7L, null, null).resolvedFulfilmentModel()).isEqualTo(FulfilmentModel.SELLER);
        assertThat(item(null, null, null).resolvedFulfilmentModel()).isEqualTo(FulfilmentModel.FIRST_PARTY);
        assertThat(item(null, "DROPSHIP", "QIKINK").resolvedFulfilmentModel()).isEqualTo(FulfilmentModel.DROPSHIP);
    }

    // --- update --------------------------------------------------------------------

    @Test
    void updateKeepsModelAndPartnerCodeWhenNotSupplied() {
        Item existing = item(null, "DROPSHIP", "QIKINK");
        when(itemRepository.findById(1L)).thenReturn(Optional.of(existing));

        Item updated = service.updateItem(1L, item(null, null, null));

        assertThat(updated.getFulfilmentModel()).isEqualTo("DROPSHIP");
        assertThat(updated.getFulfilmentPartnerCode()).isEqualTo("QIKINK");
    }

    @Test
    void updateOfLegacySellerRowKeepsSellerAndMaterialisesModel() {
        Item existing = item(7L, null, null);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(existing));

        Item updated = service.updateItem(1L, item(null, null, null));

        assertThat(updated.getSellerId()).isEqualTo(7L);
        assertThat(updated.getFulfilmentModel()).isEqualTo("SELLER");
    }

    @Test
    void updateRevalidatesResultingCombination() {
        Item existing = item(7L, "SELLER", null);
        when(itemRepository.findById(1L)).thenReturn(Optional.of(existing));

        // Supplying FIRST_PARTY without clearing the seller is an invalid combination.
        assertBadRequest(() -> service.updateItem(1L, item(null, "FIRST_PARTY", null)), "cannot have a sellerId");
        verify(itemRepository, never()).save(any());
    }

    @Test
    void updateRejectsUnknownModel() {
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item(null, null, null)));
        assertBadRequest(() -> service.updateItem(1L, item(null, "NOPE", null)), "Unknown fulfilmentModel");
    }

    @Test
    void updateToDropshipRequiresPartnerCode() {
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item(null, "FIRST_PARTY", null)));
        assertBadRequest(() -> service.updateItem(1L, item(null, "DROPSHIP", null)), "require a fulfilmentPartnerCode");
    }

    @Test
    void updateReturnsNullForUnknownId() {
        when(itemRepository.findById(99L)).thenReturn(Optional.empty());
        assertThat(service.updateItem(99L, item(null, null, null))).isNull();
    }

    // --- queries -------------------------------------------------------------------

    @Test
    void fulfilmentQueryRejectsUnknownModel() {
        assertBadRequest(() -> service.getItemsByFulfilment("BOGUS", null), "Unknown fulfilmentModel");
    }

    @Test
    void fulfilmentQueryIncludesLegacyRowsForSellerAndFirstParty() {
        when(itemRepository.findSellerFulfilled(anyString())).thenReturn(List.of());
        service.getItemsByFulfilment("SELLER", null);
        verify(itemRepository).findSellerFulfilled("SELLER");
        service.getItemsByFulfilment("first_party", null);
        verify(itemRepository).findFirstPartyFulfilled("FIRST_PARTY");
        service.getItemsByFulfilment("DROPSHIP", "");
        verify(itemRepository).findByFulfilmentModel("DROPSHIP");
    }

    @Test
    void fulfilmentQueryFiltersByNormalisedPartnerCode() {
        service.getItemsByFulfilment("DROPSHIP", " qikink ");
        verify(itemRepository).findByFulfilmentModelAndFulfilmentPartnerCode("DROPSHIP", "QIKINK");
    }

    @Test
    void sellerQueryUsesRepository() {
        service.getItemsBySeller(7L);
        verify(itemRepository).findBySellerId(7L);
    }
}
