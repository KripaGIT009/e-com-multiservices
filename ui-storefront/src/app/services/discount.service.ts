import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = 'http://localhost:8001/discounts';

  constructor(private http: HttpClient) {}

  applyDiscount(couponCode: string, cartTotal: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/apply`, null, {
      params: {
        couponCode: couponCode,
        cartTotal: cartTotal.toString()
      }
    });
  }

  validateDiscount(couponCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/validate`, null, {
      params: { couponCode }
    });
  }
}
