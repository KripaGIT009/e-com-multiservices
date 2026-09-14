package com.example.service;

import com.example.entity.FulfilmentModel;
import com.example.entity.Item;
import com.example.repository.ItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ItemServiceImpl implements IItemService {

    static final int PARTNER_CODE_MAX_LENGTH = 40;

    private final ItemRepository itemRepository;

    public ItemServiceImpl(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    public Item createItem(Item item) {
        FulfilmentModel model = item.getFulfilmentModel() == null || item.getFulfilmentModel().isBlank()
                ? (item.getSellerId() != null ? FulfilmentModel.SELLER : FulfilmentModel.FIRST_PARTY)
                : parseModel(item.getFulfilmentModel());
        String partnerCode = normalisePartnerCode(item.getFulfilmentPartnerCode());
        validateFulfilment(model, item.getSellerId(), partnerCode);
        item.setFulfilmentModel(model.name());
        item.setFulfilmentPartnerCode(partnerCode);
        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return itemRepository.save(item);
    }

    public Optional<Item> getItem(Long id) {
        return itemRepository.findById(id);
    }

    public Optional<Item> getItemBySku(String sku) {
        return itemRepository.findBySku(sku);
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public List<Item> getItemsBySeller(Long sellerId) {
        return itemRepository.findBySellerId(sellerId);
    }

    public List<Item> getItemsByFulfilment(String model, String partnerCode) {
        FulfilmentModel parsed = parseModel(model);
        String code = normalisePartnerCode(partnerCode);
        if (code != null) {
            return itemRepository.findByFulfilmentModelAndFulfilmentPartnerCode(parsed.name(), code);
        }
        return switch (parsed) {
            case SELLER -> itemRepository.findSellerFulfilled(parsed.name());
            case FIRST_PARTY -> itemRepository.findFirstPartyFulfilled(parsed.name());
            case DROPSHIP -> itemRepository.findByFulfilmentModel(parsed.name());
        };
    }

    public Item updateItem(Long id, Item itemDetails) {
        return itemRepository.findById(id).map(item -> {
            item.setName(itemDetails.getName());
            item.setDescription(itemDetails.getDescription());
            item.setPrice(itemDetails.getPrice());
            item.setQuantity(itemDetails.getQuantity());
            item.setItemType(itemDetails.getItemType());
            // Only reassign ownership when the caller actually supplied it, so an
            // edit that omits the seller cannot orphan someone's listing.
            if (itemDetails.getSellerId() != null) {
                item.setSellerId(itemDetails.getSellerId());
                item.setSellerName(itemDetails.getSellerName());
            }

            // Fulfilment fields follow the same rule: change only when supplied. The
            // resulting combination is then validated as a whole.
            boolean modelSupplied = itemDetails.getFulfilmentModel() != null
                    && !itemDetails.getFulfilmentModel().isBlank();
            FulfilmentModel model = modelSupplied
                    ? parseModel(itemDetails.getFulfilmentModel())
                    : item.resolvedFulfilmentModel();

            String partnerCode = item.getFulfilmentPartnerCode();
            if (itemDetails.getFulfilmentPartnerCode() != null) {
                // An empty string is an explicit "clear".
                partnerCode = normalisePartnerCode(itemDetails.getFulfilmentPartnerCode());
            } else if (modelSupplied && model != FulfilmentModel.DROPSHIP) {
                // Moving an item off DROPSHIP implies it no longer has a partner.
                partnerCode = null;
            }

            validateFulfilment(model, item.getSellerId(), partnerCode);
            item.setFulfilmentModel(model.name());
            item.setFulfilmentPartnerCode(partnerCode);
            item.setUpdatedAt(LocalDateTime.now());
            return itemRepository.save(item);
        }).orElse(null);
    }

    public boolean deleteItem(Long id) {
        if (itemRepository.existsById(id)) {
            itemRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public boolean decreaseQuantity(String sku, Integer quantity) {
        Optional<Item> item = itemRepository.findBySku(sku);
        if (item.isPresent() && item.get().getQuantity() >= quantity) {
            Item i = item.get();
            i.setQuantity(i.getQuantity() - quantity);
            itemRepository.save(i);
            return true;
        }
        return false;
    }

    private static FulfilmentModel parseModel(String value) {
        return FulfilmentModel.parse(value).orElseThrow(() -> badRequest(
                "Unknown fulfilmentModel '" + value + "'; expected one of "
                        + Arrays.toString(FulfilmentModel.values())));
    }

    /** Upper-case and trim; blank becomes null. */
    private static String normalisePartnerCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        String normalised = code.trim().toUpperCase(Locale.ROOT);
        if (normalised.length() > PARTNER_CODE_MAX_LENGTH) {
            throw badRequest("fulfilmentPartnerCode must be at most " + PARTNER_CODE_MAX_LENGTH + " characters");
        }
        return normalised;
    }

    private static void validateFulfilment(FulfilmentModel model, Long sellerId, String partnerCode) {
        switch (model) {
            case SELLER -> {
                if (sellerId == null) {
                    throw badRequest("SELLER items require a sellerId");
                }
            }
            case FIRST_PARTY, DROPSHIP -> {
                if (sellerId != null) {
                    throw badRequest(model + " items cannot have a sellerId");
                }
            }
        }
        if (model == FulfilmentModel.DROPSHIP && partnerCode == null) {
            throw badRequest("DROPSHIP items require a fulfilmentPartnerCode");
        }
        if (model != FulfilmentModel.DROPSHIP && partnerCode != null) {
            throw badRequest("fulfilmentPartnerCode is only allowed on DROPSHIP items");
        }
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
