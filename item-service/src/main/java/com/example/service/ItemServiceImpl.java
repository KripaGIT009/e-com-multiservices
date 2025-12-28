package com.example.service;

import com.example.entity.Item;
import com.example.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ItemServiceImpl implements IItemService {

    @Autowired
    private ItemRepository itemRepository;

    public Item createItem(Item item) {
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

    public Item updateItem(Long id, Item itemDetails) {
        return itemRepository.findById(id).map(item -> {
            item.setName(itemDetails.getName());
            item.setDescription(itemDetails.getDescription());
            item.setPrice(itemDetails.getPrice());
            item.setQuantity(itemDetails.getQuantity());
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
}
