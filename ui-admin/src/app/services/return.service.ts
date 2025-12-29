import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Return {
  id?: number;
  returnId: string;
  orderId: string;
  reason: string;
  status: string;
  refundAmount?: number;
  createdAt?: string;
  processedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReturnService {
  private apiUrl = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient) {}

  getAllReturns(): Observable<Return[]> {
    return this.http.get<Return[]>(this.apiUrl);
  }

  getReturn(id: number): Observable<Return> {
    return this.http.get<Return>(`${this.apiUrl}/${id}`);
  }

  createReturn(orderId: string, reason: string): Observable<Return> {
    return this.http.post<Return>(this.apiUrl, { orderId, reason });
  }

  updateReturnStatus(id: number, status: string): Observable<Return> {
    return this.http.put<Return>(`${this.apiUrl}/${id}/status`, { status });
  }
}
