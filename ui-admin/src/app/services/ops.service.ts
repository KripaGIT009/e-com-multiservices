import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface OpsWorkQueueSummary {
  pendingOrders: number;
  paymentProcessingOrders: number;
  readyToShipOrders: number;
  pendingReturns: number;
  failedPayments: number;
}

export interface OpsWorkQueue {
  queueType: string;
  summary: OpsWorkQueueSummary;
}

@Injectable({
  providedIn: 'root'
})
export class OpsService {
  private apiUrl = `${environment.apiUrl}/ops`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getWorkQueue(): Observable<OpsWorkQueue> {
    return this.http.get<OpsWorkQueue>(`${this.apiUrl}/work-queue`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
