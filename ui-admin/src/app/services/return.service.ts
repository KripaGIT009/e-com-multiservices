import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

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
    const action = this.mapStatusToAction(status);
    return this.http.put<Return>(`${this.apiUrl}/${id}/resolve`, { action }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  resolveReturnAction(id: number, action: 'APPROVE' | 'REJECT' | 'REFUND'): Observable<Return> {
    return this.http.put<Return>(`${this.apiUrl}/${id}/resolve`, { action }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  private mapStatusToAction(status: string): 'APPROVE' | 'REJECT' | 'REFUND' {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'APPROVED' || normalized === 'APPROVE') {
      return 'APPROVE';
    }
    if (normalized === 'REJECTED' || normalized === 'REJECT') {
      return 'REJECT';
    }
    return 'REFUND';
  }
}
