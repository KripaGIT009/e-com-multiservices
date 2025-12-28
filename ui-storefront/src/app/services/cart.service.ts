import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = '/api/cart';

  constructor(private http: HttpClient) { }

  getCart(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`);
  }

  addToCart(userId: string, itemId: string, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${userId}/add`, {
      itemId,
      quantity
    });
  }

  removeFromCart(userId: string, itemId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}/items/${itemId}`);
  }

  clearCart(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`);
  }
}
