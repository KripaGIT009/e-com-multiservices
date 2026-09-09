package com.example.service;

import com.example.dto.WishlistItemRequest;
import com.example.dto.WishlistItemResponse;
import com.example.entity.WishlistItem;
import com.example.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements IWishlistService {

    private final WishlistItemRepository repository;

    public WishlistServiceImpl(WishlistItemRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistItemResponse> getWishlist(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Saving an item already on the list is a no-op that returns the existing entry,
     * so tapping the heart twice cannot create a duplicate or raise an error.
     */
    @Override
    @Transactional
    public WishlistItemResponse addItem(Long userId, WishlistItemRequest request) {
        return repository.findByUserIdAndItemId(userId, request.getItemId())
                .map(this::toResponse)
                .orElseGet(() -> toResponse(repository.save(new WishlistItem(
                        userId,
                        request.getItemId(),
                        request.getItemName() != null ? request.getItemName() : "Item " + request.getItemId(),
                        request.getPrice()
                ))));
    }

    @Override
    @Transactional
    public boolean removeItem(Long userId, Long itemId) {
        if (!repository.existsByUserIdAndItemId(userId, itemId)) {
            return false;
        }
        repository.deleteByUserIdAndItemId(userId, itemId);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean contains(Long userId, Long itemId) {
        return repository.existsByUserIdAndItemId(userId, itemId);
    }

    @Override
    @Transactional(readOnly = true)
    public long count(Long userId) {
        return repository.countByUserId(userId);
    }

    private WishlistItemResponse toResponse(WishlistItem i) {
        return new WishlistItemResponse(
                i.getId(), i.getItemId(), i.getItemName(), i.getPriceAtSave(), i.getCreatedAt());
    }
}
