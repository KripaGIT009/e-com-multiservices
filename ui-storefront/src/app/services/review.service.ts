import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:8007/items';

  constructor(private http: HttpClient) {}

  addReview(itemId: number, reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${itemId}/reviews`, reviewData);
  }

  getReviews(itemId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${itemId}/reviews`);
  }

  getAverageRating(itemId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${itemId}/reviews/average-rating`);
  }

  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reviews/${reviewId}`);
  }
}
