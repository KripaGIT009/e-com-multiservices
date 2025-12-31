package com.example.controller;

import com.example.dto.ItemRequest;
import com.example.dto.ItemResponse;
import com.example.entity.Item;
import com.example.service.IItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/items")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ItemController {

    @Autowired
    private IItemService itemService;

    @PostMapping
    public ResponseEntity<ItemResponse> createItem(@RequestBody ItemRequest request) {
        Item item = new Item(request.getSku(), request.getName(), request.getDescription(),
                           request.getPrice(), request.getQuantity());
        Item created = itemService.createItem(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItem(@PathVariable Long id) {
        Optional<Item> item = itemService.getItem(id);
        return item.map(i -> ResponseEntity.ok(convertToResponse(i))).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<ItemResponse> getItemBySku(@PathVariable String sku) {
        Optional<Item> item = itemService.getItemBySku(sku);
        return item.map(i -> ResponseEntity.ok(convertToResponse(i))).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<ItemResponse>> getAllItems() {
        List<Item> items = itemService.getAllItems();
        return ResponseEntity.ok(items.stream().map(this::convertToResponse).collect(Collectors.toList()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemResponse> updateItem(@PathVariable Long id, @RequestBody ItemRequest request) {
        Item itemDetails = new Item(request.getSku(), request.getName(), request.getDescription(),
                                   request.getPrice(), request.getQuantity());
        Item updated = itemService.updateItem(id, itemDetails);
        return updated != null ? ResponseEntity.ok(convertToResponse(updated)) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        return itemService.deleteItem(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/{sku}/decrease")
    public ResponseEntity<String> decreaseQuantity(@PathVariable String sku, @RequestParam Integer quantity) {
        boolean success = itemService.decreaseQuantity(sku, quantity);
        return success ? ResponseEntity.ok("Quantity decreased") : ResponseEntity.badRequest().body("Failed to decrease quantity");
    }

    private ItemResponse convertToResponse(Item item) {
        return new ItemResponse(
            item.getId(),
            item.getSku(),
            item.getName(),
            item.getDescription(),
            item.getPrice(),
            item.getQuantity(),
            item.getItemType(),
            item.getCreatedAt(),
            item.getUpdatedAt()
        );
    }
}
