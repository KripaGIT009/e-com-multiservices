package com.example.service;

import com.example.entity.Cart;
import com.example.entity.CartItem;
import com.example.repository.CartRepository;
import com.example.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CartServiceImpl implements ICartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    public Cart createCart(Long userId) {
        Cart cart = new Cart(userId);
        cart.setCreatedAt(LocalDateTime.now());
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Optional<Cart> getCart(Long cartId) {
        return cartRepository.findById(cartId);
    }

    public Optional<Cart> getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }

    public CartItem addItemToCart(Long cartId, Long itemId, String itemName, Integer quantity, BigDecimal price) {
        CartItem item = new CartItem(cartId, itemId, itemName, quantity, price);
        CartItem saved = cartItemRepository.save(item);
        
        Cart cart = cartRepository.findById(cartId).orElse(null);
        if (cart != null) {
            cart.setItemCount(cart.getItemCount() + 1);
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
        }
        return saved;
    }

    public boolean removeItemFromCart(Long cartId, Long itemId) {
        // itemId here is the CartItem's database ID (from the cart_items table)
        Optional<CartItem> cartItem = cartItemRepository.findById(itemId);
        if (cartItem.isPresent() && cartItem.get().getCartId().equals(cartId)) {
            cartItemRepository.deleteById(itemId);
            Cart cart = cartRepository.findById(cartId).orElse(null);
            if (cart != null) {
                cart.setItemCount(Math.max(0, cart.getItemCount() - 1));
                cart.setUpdatedAt(LocalDateTime.now());
                cartRepository.save(cart);
            }
            return true;
        }
        return false;
    }

    public CartItem updateItemQuantity(Long cartId, Long cartItemId, Integer newQuantity) {
        Optional<CartItem> cartItem = cartItemRepository.findById(cartItemId);
        if (cartItem.isPresent() && cartItem.get().getCartId().equals(cartId)) {
            CartItem item = cartItem.get();
            if (newQuantity <= 0) {
                removeItemFromCart(cartId, cartItemId);
                return null;
            }
            item.setQuantity(newQuantity);
            CartItem updated = cartItemRepository.save(item);
            
            Cart cart = cartRepository.findById(cartId).orElse(null);
            if (cart != null) {
                cart.setUpdatedAt(LocalDateTime.now());
                cartRepository.save(cart);
            }
            return updated;
        }
        return null;
    }

    public List<CartItem> getCartItems(Long cartId) {
        return cartItemRepository.findByCartId(cartId);
    }

    public void clearCart(Long cartId) {
        List<CartItem> items = cartItemRepository.findByCartId(cartId);
        cartItemRepository.deleteAll(items);
        
        Cart cart = cartRepository.findById(cartId).orElse(null);
        if (cart != null) {
            cart.setItemCount(0);
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
        }
    }
}
