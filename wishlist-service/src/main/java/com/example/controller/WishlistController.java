package com.example.controller;

import com.example.dto.WishlistItemRequest;
import com.example.dto.WishlistItemResponse;
import com.example.service.IWishlistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * The userId is supplied by the BFF, which resolves it from the caller's token.
 * This service is not reachable from the browser.
 */
@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WishlistController {

    private final IWishlistService wishlistService;

    public WishlistController(IWishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<WishlistItemResponse>> getWishlist(@PathVariable Long userId) {
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Map<String, Long>> count(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("count", wishlistService.count(userId)));
    }

    @GetMapping("/user/{userId}/contains/{itemId}")
    public ResponseEntity<Map<String, Boolean>> contains(@PathVariable Long userId,
                                                         @PathVariable Long itemId) {
        return ResponseEntity.ok(Map.of("saved", wishlistService.contains(userId, itemId)));
    }

    @PostMapping("/user/{userId}/items")
    public ResponseEntity<WishlistItemResponse> addItem(@PathVariable Long userId,
                                                        @Valid @RequestBody WishlistItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(wishlistService.addItem(userId, request));
    }

    @DeleteMapping("/user/{userId}/items/{itemId}")
    public ResponseEntity<Void> removeItem(@PathVariable Long userId, @PathVariable Long itemId) {
        return wishlistService.removeItem(userId, itemId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "wishlist-service"));
    }
}
