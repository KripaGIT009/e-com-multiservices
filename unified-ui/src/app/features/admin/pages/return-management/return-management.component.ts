import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ReturnRequest {
  id: number;
  orderId: number;
  reason: string;
  status: string;
  requestDate: string;
}

/**
 * Admin Return Management sub-page.
 * Displays a return request table with approve/reject actions.
 * Requirements: 14.1, 14.2, 14.3
 */
@Component({
  selector: 'app-return-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './return-management.component.html',
  styleUrls: ['./return-management.component.scss'],
})
export class ReturnManagementComponent implements OnInit {
  returns: ReturnRequest[] = [];
  isLoading = true;
  errorMessage = '';
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  showToast = false;
  processingId: number | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<ReturnRequest[]>('/api/returns').subscribe({
      next: (data) => {
        this.returns = data.map((r) => ({
          ...r,
          reason: r.reason || 'N/A',
          status: r.status || 'UNKNOWN',
          requestDate: r.requestDate || '',
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load return requests. Please try again.';
        this.isLoading = false;
      },
    });
  }

  approveReturn(returnId: number): void {
    this.processingId = returnId;

    this.http.put(`/api/returns/${returnId}/approve`, {}).subscribe({
      next: () => {
        const item = this.returns.find((r) => r.id === returnId);
        if (item) {
          item.status = 'APPROVED';
        }
        this.processingId = null;
        this.displayToast('Return approved successfully.', 'success');
      },
      error: () => {
        this.processingId = null;
        this.displayToast('Failed to approve return. Please try again.', 'error');
      },
    });
  }

  rejectReturn(returnId: number): void {
    this.processingId = returnId;

    this.http.put(`/api/returns/${returnId}/reject`, {}).subscribe({
      next: () => {
        const item = this.returns.find((r) => r.id === returnId);
        if (item) {
          item.status = 'REJECTED';
        }
        this.processingId = null;
        this.displayToast('Return rejected successfully.', 'success');
      },
      error: () => {
        this.processingId = null;
        this.displayToast('Failed to reject return. Please try again.', 'error');
      },
    });
  }

  isPending(status: string): boolean {
    return status?.toUpperCase() === 'PENDING';
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private displayToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}
