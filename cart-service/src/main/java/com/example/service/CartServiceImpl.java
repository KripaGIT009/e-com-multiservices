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
        List<CartItem> items = cartItemRepository.findByCartId(cartId);
        for (CartItem item : items) {
            if (item.getItemId().equals(itemId)) {
                cartItemRepository.delete(item);
                Cart cart = cartRepository.findById(cartId).orElse(null);
                if (cart != null) {
                    cart.setItemCount(Math.max(0, cart.getItemCount() - 1));
                    cart.setUpdatedAt(LocalDateTime.now());
                    cartRepository.save(cart);
                }
                return true;
            }
        }
        return false;
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
