package com.example.service;

import com.example.dto.ReviewRequest;
import com.example.entity.Review;
import com.example.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    public Review addReview(Long itemId, ReviewRequest request) {
        // Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        Review review = new Review(
                itemId,
                request.getReviewerName(),
                request.getReviewerEmail(),
                request.getRating(),
                request.getComment()
        );

        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByItemId(Long itemId) {
        return reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId);
    }

    public Optional<Review> getReviewById(Long reviewId) {
        return reviewRepository.findById(reviewId);
    }

    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }

    public Double getAverageRating(Long itemId) {
        List<Review> reviews = getReviewsByItemId(itemId);
        if (reviews.isEmpty()) {
            return 0.0;
        }
        double average = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);
        return Math.round(average * 10.0) / 10.0;
    }
}
