package com.example.itemservice.controller;

import com.example.itemservice.entity.CompareList;
import com.example.itemservice.service.CompareListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/compare")
@CrossOrigin(origins = "*")
public class CompareListController {
    @Autowired
    private CompareListService compareListService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<CompareList> getCompareList(@PathVariable Long userId) {
        CompareList compareList = compareListService.getCompareList(userId);
        return ResponseEntity.ok(compareList);
    }

    @PostMapping("/user/{userId}/items/{itemId}")
    public ResponseEntity<CompareList> addToCompare(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        CompareList compareList = compareListService.addToCompare(userId, itemId);
        return ResponseEntity.ok(compareList);
    }

    @DeleteMapping("/user/{userId}/items/{itemId}")
    public ResponseEntity<CompareList> removeFromCompare(
            @PathVariable Long userId,
            @PathVariable Long itemId) {
        CompareList compareList = compareListService.removeFromCompare(userId, itemId);
        return ResponseEntity.ok(compareList);
    }

    @DeleteMapping("/user/{userId}/clear")
    public ResponseEntity<CompareList> clearCompareList(@PathVariable Long userId) {
        CompareList compareList = compareListService.clearCompareList(userId);
        return ResponseEntity.ok(compareList);
    }
}
