import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getOrderById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateOrderStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status }, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getOrderWorkflowActions(id: number): Observable<OrderWorkflowActionsResponse> {
    return this.http.get<OrderWorkflowActionsResponse>(
      `${this.apiUrl}/${id}/workflow/actions`,
      {
        headers: this.authService.getAuthHeaders()
      }
    );
  }

  executeOrderWorkflowAction(id: number, action: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/workflow/actions`, { action }, {
      headers: this.authService.getAuthHeaders()
    });
  }
}

export interface OrderWorkflowActionsResponse {
  orderId: number;
  currentStatus: string;
  availableActions: string[];
  recommendedAction?: string;
  actionPriorities?: Record<string, number>;
}
