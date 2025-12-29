import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = '/api/payments';

  constructor(private http: HttpClient) { }

  processPayment(paymentDetails: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/process`, paymentDetails);
  }

  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/methods`);
  }

  validatePayment(paymentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${paymentId}`);
  }
}
