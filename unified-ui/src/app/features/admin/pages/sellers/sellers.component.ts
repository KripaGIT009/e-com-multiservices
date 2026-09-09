import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';

interface Seller {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  gstin?: string;
  pickupCity?: string;
  pickupPostalCode?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  statusReason?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss'],
})
export class SellersComponent implements OnInit {
  sellers: Seller[] = [];
  isLoading = true;
  filter: 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' = 'PENDING_APPROVAL';
  savingId: number | null = null;

  /** Reason captured before a reject or suspend, so the seller is told why. */
  reasonFor: number | null = null;
  reason = '';
  pendingAction: 'REJECTED' | 'SUSPENDED' | null = null;

  constructor(
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<Seller[]>('/api/sellers').subscribe({
      next: (s) => { this.sellers = s; this.isLoading = false; },
      error: () => { this.isLoading = false; this.notify.show('Could not load sellers.', 'error'); },
    });
  }

  get visible(): Seller[] {
    return this.filter === 'ALL'
      ? this.sellers
      : this.sellers.filter((s) => s.status === this.filter);
  }

  countOf(status: Seller['status']): number {
    return this.sellers.filter((s) => s.status === status).length;
  }

  statusClass(status: string): string {
    if (status === 'APPROVED') return 'is-approved';
    if (status === 'PENDING_APPROVAL') return 'is-pending';
    return 'is-blocked';
  }

  approve(s: Seller): void {
    this.setStatus(s, 'APPROVED');
  }

  /** Reject and suspend need a reason — the seller is shown it when they sign in. */
  askReason(s: Seller, action: 'REJECTED' | 'SUSPENDED'): void {
    this.reasonFor = s.id;
    this.pendingAction = action;
    this.reason = '';
  }

  cancelReason(): void {
    this.reasonFor = null;
    this.pendingAction = null;
    this.reason = '';
  }

  confirmReason(s: Seller): void {
    if (!this.pendingAction) return;
    if (!this.reason.trim()) {
      this.notify.show('Give a reason — the seller is shown it.', 'warning');
      return;
    }
    this.setStatus(s, this.pendingAction, this.reason.trim());
  }

  private setStatus(s: Seller, status: Seller['status'], reason?: string): void {
    this.savingId = s.id;
    this.http.put<Seller>(`/api/sellers/${s.id}/status`, { status, reason }).subscribe({
      next: (updated) => {
        this.savingId = null;
        this.cancelReason();
        this.sellers = this.sellers.map((x) => (x.id === updated.id ? updated : x));
        this.notify.show(`${updated.businessName} is now ${updated.status.replace('_', ' ').toLowerCase()}.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.savingId = null;
        this.notify.show(err.error?.error || 'Could not update that seller.', 'error');
      },
    });
  }
}
