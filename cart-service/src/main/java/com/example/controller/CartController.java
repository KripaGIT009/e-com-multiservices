package com.example.controller;

import com.example.dto.CartItemRequest;
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
public class CartController {

    @Autowired
    private ICartService cartService;

    @PostMapping
    public ResponseEntity<Cart> createCart(@RequestParam Long userId) {
        Cart cart = cartService.createCart(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(cart);
    }

    @GetMapping("/{cartId}")
    public ResponseEntity<Cart> getCart(@PathVariable Long cartId) {
        Optional<Cart> cart = cartService.getCart(cartId);
        return cart.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Cart> getCartByUserId(@PathVariable Long userId) {
        Optional<Cart> cart = cartService.getCartByUserId(userId);
        return cart.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
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

    @DeleteMapping("/{cartId}/clear")
    public ResponseEntity<Void> clearCart(@PathVariable Long cartId) {
        cartService.clearCart(cartId);
        return ResponseEntity.noContent().build();
    }
}
