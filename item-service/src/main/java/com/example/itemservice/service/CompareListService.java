package com.example.itemservice.service;

import com.example.itemservice.entity.CompareList;
import com.example.itemservice.repository.CompareListRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CompareListService {
    @Autowired
    private CompareListRepository compareListRepository;

    public CompareList getOrCreateCompareList(Long userId) {
        CompareList compareList = compareListRepository.findByUserId(userId);
        if (compareList == null) {
            compareList = new CompareList();
            compareList.setUserId(userId);
            compareList.setItemIds(new ArrayList<>());
            compareList = compareListRepository.save(compareList);
        }
        return compareList;
    }

    public CompareList addToCompare(Long userId, Long itemId) {
        CompareList compareList = getOrCreateCompareList(userId);
        if (!compareList.getItemIds().contains(itemId)) {
            if (compareList.getItemIds().size() < 4) {
                compareList.getItemIds().add(itemId);
                compareList.setUpdatedAt(LocalDateTime.now());
                compareList = compareListRepository.save(compareList);
            }
        }
        return compareList;
    }

    public CompareList removeFromCompare(Long userId, Long itemId) {
        CompareList compareList = getOrCreateCompareList(userId);
        compareList.getItemIds().remove(itemId);
        compareList.setUpdatedAt(LocalDateTime.now());
        return compareListRepository.save(compareList);
    }

    public CompareList clearCompareList(Long userId) {
        CompareList compareList = getOrCreateCompareList(userId);
        compareList.getItemIds().clear();
        compareList.setUpdatedAt(LocalDateTime.now());
        return compareListRepository.save(compareList);
    }

    public CompareList getCompareList(Long userId) {
        return getOrCreateCompareList(userId);
    }
}
