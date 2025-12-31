import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  shippingAddress: string;
  trackingNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {
  private apiUrl = 'http://localhost:8001/orders';

  constructor(private http: HttpClient) {}

  getUserOrders(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/user/${userId}`);
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
  }

  cancelOrder(orderId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/cancel`, {});
  }

  trackOrder(trackingNumber: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/track/${trackingNumber}`);
  }
}
