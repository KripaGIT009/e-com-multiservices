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
                           request.getPrice(), request.getQuantity(), request.getItemType());
        item.setSellerId(request.getSellerId());
        item.setSellerName(request.getSellerName());
        item.setFulfilmentModel(request.getFulfilmentModel());
        item.setFulfilmentPartnerCode(request.getFulfilmentPartnerCode());
        // The service validates the fulfilment combination (400 on an invalid one).
        Item created = itemService.createItem(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(created));
    }

    /** Everything a given seller has listed — the seller dashboard's catalogue. */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ItemResponse>> getBySeller(@PathVariable Long sellerId) {
        List<Item> items = itemService.getItemsBySeller(sellerId);
        return ResponseEntity.ok(items.stream().map(this::convertToResponse).collect(Collectors.toList()));
    }

    /** Items of one fulfilment model, optionally one dropship partner. Unknown model → 400. */
    @GetMapping("/fulfilment/{model}")
    public ResponseEntity<List<ItemResponse>> getByFulfilment(@PathVariable String model,
                                                              @RequestParam(required = false) String partnerCode) {
        List<Item> items = itemService.getItemsByFulfilment(model, partnerCode);
        return ResponseEntity.ok(items.stream().map(this::convertToResponse).collect(Collectors.toList()));
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
                                   request.getPrice(), request.getQuantity(), request.getItemType());
        itemDetails.setSellerId(request.getSellerId());
        itemDetails.setSellerName(request.getSellerName());
        itemDetails.setFulfilmentModel(request.getFulfilmentModel());
        itemDetails.setFulfilmentPartnerCode(request.getFulfilmentPartnerCode());
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
        ItemResponse response = new ItemResponse(
            item.getId(),
            item.getSku(),
            item.getName(),
            item.getDescription(),
            item.getPrice(),
            item.getQuantity(),
            item.getItemType(),
            item.getSellerId(),
            item.getSellerName(),
            item.getCreatedAt(),
            item.getUpdatedAt()
        );
        response.setFulfilmentModel(item.resolvedFulfilmentModel().name());
        response.setFulfilmentPartnerCode(item.getFulfilmentPartnerCode());
        return response;
    }
}
