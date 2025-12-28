import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CartItem {
  id?: number;
  cartId: string;
  itemId: number;
  itemName?: string;
  quantity: number;
  price?: number;
}

export interface Cart {
  id?: number;
  cartId: string;
  userId: string;
  items: CartItem[];
  totalAmount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = `${environment.apiUrl}/cart`;

  constructor(private http: HttpClient) {}

  getCart(userId: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.apiUrl}/${userId}`);
  }

  addItem(userId: string, itemId: number, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.apiUrl}/${userId}/items`, { itemId, quantity });
  }

  updateItem(userId: string, itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.apiUrl}/${userId}/items/${itemId}`, { quantity });
  }

  removeItem(userId: string, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/items/${itemId}`);
  }

  clearCart(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }
}
