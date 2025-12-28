package com.example.service;

import com.example.entity.Item;
import java.util.List;
import java.util.Optional;

public interface IItemService {
    Item createItem(Item item);
    Optional<Item> getItem(Long id);
    Optional<Item> getItemBySku(String sku);
    List<Item> getAllItems();
    Item updateItem(Long id, Item item);
    boolean deleteItem(Long id);
    boolean decreaseQuantity(String sku, Integer quantity);
}
