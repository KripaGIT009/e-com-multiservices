package com.example.controller;

import com.example.dto.CartItemRequest;
import com.example.dto.UpdateQuantityRequest;
import com.example.entity.Cart;
import com.example.entity.CartItem;
import com.example.service.ICartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/carts")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CartController {

    @Autowired
    private ICartService cartService;

    @PostMapping
    public ResponseEntity<Cart> createCart(@RequestParam String userId) {
        Long numUserId = convertUserIdToLong(userId);
        Cart cart = cartService.createCart(numUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cart);
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long cartId) {
        Optional<Cart> cart = cartService.getCart(cartId);
        return cart.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable String userId) {
        Long numUserId = convertUserIdToLong(userId);
        Optional<Cart> existing = cartService.getCartByUserId(numUserId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get());
        }
        Cart created = cartService.createCart(numUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{cartId}/items")
    public ResponseEntity<CartItem> addItemToCart(@PathVariable Long cartId, @RequestBody CartItemRequest request) {
        CartItem item = cartService.addItemToCart(cartId, request.getItemId(), request.getItemName(),
                                                  request.getQuantity(), request.getPrice());
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @GetMapping("/{cartId}/items")
    public ResponseEntity<List<CartItem>> getCartItems(@PathVariable Long cartId) {
        return ResponseEntity.ok(cartService.getCartItems(cartId));
    }

    @DeleteMapping("/{cartId}/items/{itemId}")
    public ResponseEntity<Void> removeItemFromCart(@PathVariable Long cartId, @PathVariable Long itemId) {
        return cartService.removeItemFromCart(cartId, itemId) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/{cartId}/items/{cartItemId}")
    public ResponseEntity<CartItem> updateItemQuantity(@PathVariable Long cartId, @PathVariable Long cartItemId, @RequestBody UpdateQuantityRequest request) {
        CartItem updated = cartService.updateItemQuantity(cartId, cartItemId, request.getQuantity());
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{cartId}/clear")
    public ResponseEntity<Void> clearCart(@PathVariable Long cartId) {
        cartService.clearCart(cartId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Convert string userId (like "guest" or numeric string) to Long
     */
    private Long convertUserIdToLong(String userId) {
        if (userId == null || userId.isEmpty() || "guest".equalsIgnoreCase(userId)) {
            return 0L; // Use 0 for guest users
        }
        try {
            return Long.parseLong(userId);
        } catch (NumberFormatException e) {
            return 0L; // Default to guest for non-numeric values
        }
    }
}
