import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private apiUrl = '/api/checkout';

  constructor(private http: HttpClient) { }

  checkout(order: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, order);
  }

  getCheckoutDetails(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${orderId}`);
  }
}
