package com.example.service;

import com.example.dto.WishlistItemRequest;
import com.example.dto.WishlistItemResponse;

import java.util.List;

public interface IWishlistService {
    List<WishlistItemResponse> getWishlist(Long userId);
    WishlistItemResponse addItem(Long userId, WishlistItemRequest request);
    boolean removeItem(Long userId, Long itemId);
    boolean contains(Long userId, Long itemId);
    long count(Long userId);
}
