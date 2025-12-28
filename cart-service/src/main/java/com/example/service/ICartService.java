package com.example.service;

import com.example.entity.Cart;
import com.example.entity.CartItem;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ICartService {
    Cart createCart(Long userId);
    Optional<Cart> getCart(Long cartId);
    Optional<Cart> getCartByUserId(Long userId);
    CartItem addItemToCart(Long cartId, Long itemId, String itemName, Integer quantity, BigDecimal price);
    List<CartItem> getCartItems(Long cartId);
    boolean removeItemFromCart(Long cartId, Long itemId);
    void clearCart(Long cartId);
}
