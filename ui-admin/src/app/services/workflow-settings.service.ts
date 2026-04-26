import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface WorkflowPriorityResponse {
  actionPriorities: Record<string, number>;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowSettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getOrderWorkflowPriorities(): Observable<WorkflowPriorityResponse> {
    return this.http.get<WorkflowPriorityResponse>(`${this.apiUrl}/order-workflow-priorities`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  updateOrderWorkflowPriorities(actionPriorities: Record<string, number>): Observable<WorkflowPriorityResponse> {
    return this.http.put<WorkflowPriorityResponse>(`${this.apiUrl}/order-workflow-priorities`, { actionPriorities }, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
