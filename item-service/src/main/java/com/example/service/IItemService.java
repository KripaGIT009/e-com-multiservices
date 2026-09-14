package com.example.service;

import com.example.entity.Item;
import java.util.List;
import java.util.Optional;

public interface IItemService {
    /**
     * Validates the fulfilment combination (docs/commerce-architecture.md §9.1) and saves.
     * {@code item.fulfilmentModel} may carry the raw requested value; it is parsed and
     * normalised here. Throws 400 {@code ResponseStatusException} on an invalid combination.
     */
    Item createItem(Item item);
    Optional<Item> getItem(Long id);
    Optional<Item> getItemBySku(String sku);
    List<Item> getAllItems();
    List<Item> getItemsBySeller(Long sellerId);
    /** Items of one fulfilment model, optionally one partner. Unknown model → 400. */
    List<Item> getItemsByFulfilment(String model, String partnerCode);
    /** Returns null when the id is unknown; 400 on an invalid resulting combination. */
    Item updateItem(Long id, Item item);
    boolean deleteItem(Long id);
    boolean decreaseQuantity(String sku, Integer quantity);
}
