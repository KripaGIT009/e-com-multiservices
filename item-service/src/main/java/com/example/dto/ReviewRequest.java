package com.example.dto;

import java.time.LocalDateTime;

public class ReviewRequest {
    private String reviewerName;
    private String reviewerEmail;
    private Integer rating;
    private String comment;

    public ReviewRequest() {}

    public ReviewRequest(String reviewerName, String reviewerEmail, Integer rating, String comment) {
        this.reviewerName = reviewerName;
        this.reviewerEmail = reviewerEmail;
        this.rating = rating;
        this.comment = comment;
    }

    // Getters and Setters
    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public String getReviewerEmail() { return reviewerEmail; }
    public void setReviewerEmail(String reviewerEmail) { this.reviewerEmail = reviewerEmail; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
