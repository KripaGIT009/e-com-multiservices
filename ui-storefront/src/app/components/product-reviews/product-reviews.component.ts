import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRatingModule } from '@angular/material/rating';
import { ActivatedRoute } from '@angular/router';
import { ReviewService } from '../../services/review.service';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="reviews-container">
      <div class="reviews-header">
        <h2>Customer Reviews & Ratings</h2>
        <div class="rating-summary" *ngIf="averageRating > 0">
          <div class="rating-display">
            <span class="rating-number">{{ averageRating }}</span>
            <div class="stars">
              <span *ngFor="let i of [1,2,3,4,5]" class="star" [ngClass]="i <= Math.round(averageRating) ? 'filled' : ''">★</span>
            </div>
            <span class="review-count">{{ reviews.length }} reviews</span>
          </div>
        </div>
      </div>

      <!-- Add Review Section -->
      <div class="add-review-section" *ngIf="!isSubmitting">
        <h3>Share Your Experience</h3>
        <form [formGroup]="reviewForm" (ngSubmit)="onSubmitReview()">
          <div class="form-group">
            <label>Your Rating</label>
            <div class="star-selector">
              <button
                *ngFor="let i of [1,2,3,4,5]"
                type="button"
                class="star-btn"
                [ngClass]="i <= formRating ? 'selected' : ''"
                (click)="setRating(i)"
              >
                ★
              </button>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Name</mat-label>
            <input matInput formControlName="reviewerName" placeholder="Enter your name" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Address</mat-label>
            <input matInput formControlName="reviewerEmail" type="email" placeholder="your@email.com" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Review</mat-label>
            <textarea matInput formControlName="comment" placeholder="Share your thoughts about this product..." rows="5" required></textarea>
          </mat-form-field>

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="!reviewForm.valid || formRating === 0">
              <mat-icon>send</mat-icon>
              Submit Review
            </button>
          </div>
        </form>
      </div>

      <div class="submission-message" *ngIf="isSubmitting">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h3>Review Submitted Successfully!</h3>
        <p>Thank you for sharing your feedback. Your review will be displayed after moderation.</p>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        <h3>{{ reviews.length }} Reviews</h3>
        <div *ngIf="reviews.length === 0" class="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>

        <div *ngFor="let review of reviews" class="review-card">
          <div class="review-header">
            <div class="reviewer-info">
              <div class="reviewer-avatar">{{ getInitials(review.reviewerName) }}</div>
              <div class="reviewer-details">
                <h4>{{ review.reviewerName }}</h4>
                <div class="stars-display">
                  <span *ngFor="let i of [1,2,3,4,5]" class="star" [ngClass]="i <= review.rating ? 'filled' : ''">★</span>
                  <span class="rating-value">({{ review.rating }}/5)</span>
                </div>
              </div>
            </div>
            <span class="review-date">{{ review.createdAt | date:'short' }}</span>
          </div>

          <p class="review-text">{{ review.comment }}</p>

          <div class="review-actions">
            <button mat-icon-button matTooltip="Helpful" class="helpful-btn">
              <mat-icon>thumb_up</mat-icon>
              <span class="count">0</span>
            </button>
            <button mat-icon-button matTooltip="Not Helpful" class="unhelpful-btn">
              <mat-icon>thumb_down</mat-icon>
              <span class="count">0</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reviews-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .reviews-header {
      margin-bottom: 40px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 20px;
    }

    .reviews-header h2 {
      color: #232f3e;
      margin: 0 0 20px 0;
      font-size: 24px;
    }

    .rating-summary {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .rating-number {
      font-size: 36px;
      font-weight: 700;
      color: #ff9900;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      color: #ccc;
      font-size: 20px;
    }

    .star.filled {
      color: #ff9900;
    }

    .review-count {
      color: #666;
      font-size: 14px;
    }

    .add-review-section {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 40px;
    }

    .add-review-section h3 {
      color: #232f3e;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 18px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #232f3e;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .star-selector {
      display: flex;
      gap: 10px;
    }

    .star-btn {
      border: 2px solid #ddd;
      background: white;
      color: #ccc;
      font-size: 32px;
      width: 50px;
      height: 50px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .star-btn:hover {
      border-color: #ff9900;
      color: #ff9900;
      transform: scale(1.1);
    }

    .star-btn.selected {
      border-color: #ff9900;
      background-color: #fff3e0;
      color: #ff9900;
    }

    .full-width {
      width: 100% !important;
      margin-bottom: 15px;
    }

    .form-actions {
      margin-top: 20px;
      text-align: center;
    }

    .form-actions button {
      background-color: #ff9900;
    }

    .form-actions button:hover {
      background-color: #e68a00;
    }

    .submission-message {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin-bottom: 40px;
      color: #155724;
    }

    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #28a745;
      margin-bottom: 10px;
    }

    .submission-message h3 {
      margin: 10px 0;
      color: #155724;
    }

    .reviews-list {
      margin-top: 40px;
    }

    .reviews-list h3 {
      color: #232f3e;
      margin-bottom: 20px;
      font-size: 18px;
    }

    .no-reviews {
      text-align: center;
      padding: 40px 20px;
      background: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }

    .review-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .reviewer-info {
      display: flex;
      gap: 15px;
      flex: 1;
    }

    .reviewer-avatar {
      width: 40px;
      height: 40px;
      background: #ff9900;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }

    .reviewer-details h4 {
      margin: 0 0 5px 0;
      color: #232f3e;
    }

    .stars-display {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
    }

    .rating-value {
      color: #888;
      margin-left: 5px;
    }

    .review-date {
      color: #888;
      font-size: 12px;
      white-space: nowrap;
    }

    .review-text {
      color: #666;
      line-height: 1.6;
      margin: 0 0 15px 0;
    }

    .review-actions {
      display: flex;
      gap: 10px;
    }

    .helpful-btn, .unhelpful-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #666;
    }

    .helpful-btn:hover {
      color: #28a745;
    }

    .unhelpful-btn:hover {
      color: #dc3545;
    }

    .count {
      font-size: 12px;
    }

    ::ng-deep {
      .mat-mdc-form-field {
        width: 100%;
      }
    }
  `]
})
export class ProductReviewsComponent implements OnInit {
  reviewForm: FormGroup;
  formRating = 0;
  reviews: any[] = [];
  averageRating = 0;
  isSubmitting = false;
  itemId: number = 0;
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private route: ActivatedRoute
  ) {
    this.reviewForm = this.fb.group({
      reviewerName: ['', Validators.required],
      reviewerEmail: ['', [Validators.required, Validators.email]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.itemId = params['itemId'] || 1;
      this.loadReviews();
      this.loadAverageRating();
    });
  }

  loadReviews(): void {
    this.reviewService.getReviews(this.itemId).subscribe(
      (reviews: any) => {
        this.reviews = reviews;
      }
    );
  }

  loadAverageRating(): void {
    this.reviewService.getAverageRating(this.itemId).subscribe(
      (rating: any) => {
        this.averageRating = rating;
      }
    );
  }

  setRating(rating: number): void {
    this.formRating = rating;
    this.reviewForm.patchValue({ rating });
  }

  onSubmitReview(): void {
    if (this.reviewForm.valid && this.formRating > 0) {
      const reviewData = {
        ...this.reviewForm.value,
        rating: this.formRating
      };

      this.reviewService.addReview(this.itemId, reviewData).subscribe(
        (response: any) => {
          this.isSubmitting = true;
          setTimeout(() => {
            this.reviewForm.reset();
            this.formRating = 0;
            this.loadReviews();
            this.loadAverageRating();
            this.isSubmitting = false;
          }, 2000);
        },
        (error: any) => {
          console.error('Error submitting review', error);
        }
      );
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
