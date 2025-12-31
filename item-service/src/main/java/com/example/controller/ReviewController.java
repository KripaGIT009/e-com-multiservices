package com.example.controller;

import com.example.dto.ReviewRequest;
import com.example.entity.Review;
import com.example.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/items")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/{itemId}/reviews")
    public ResponseEntity<Review> addReview(@PathVariable Long itemId, @RequestBody ReviewRequest request) {
        try {
            Review review = reviewService.addReview(itemId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{itemId}/reviews")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long itemId) {
        List<Review> reviews = reviewService.getReviewsByItemId(itemId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/{itemId}/reviews/average-rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long itemId) {
        Double averageRating = reviewService.getAverageRating(itemId);
        return ResponseEntity.ok(averageRating);
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        Optional<Review> review = reviewService.getReviewById(reviewId);
        if (review.isPresent()) {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
