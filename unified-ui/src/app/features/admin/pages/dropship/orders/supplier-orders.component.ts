import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import {
  DropshipPartner,
  SupplierOrder,
  SupplierOrderStatus,
  SUPPLIER_STATUS_LABELS,
} from '../../../models';

interface StatusTab {
  key: string;
  label: string;
  /** Sent as ?status=, comma-joined when a tab covers several. */
  statuses: SupplierOrderStatus[];
}

const TABS: StatusTab[] = [
  { key: 'needs', label: 'Needs placing', statuses: ['AWAITING_MANUAL_PLACEMENT'] },
  { key: 'failed', label: 'Failed', statuses: ['FAILED'] },
  { key: 'progress', label: 'In progress', statuses: ['SUBMITTED', 'ACCEPTED'] },
  { key: 'shipped', label: 'Shipped', statuses: ['SHIPPED'] },
  { key: 'all', label: 'All', statuses: [] },
];

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './supplier-orders.component.html',
  styleUrls: ['./supplier-orders.component.scss'],
})
export class SupplierOrdersComponent implements OnInit {
  orders: SupplierOrder[] = [];
  partners: DropshipPartner[] = [];
  isLoading = true;
  loadError = '';

  tab: StatusTab = TABS[0];
  filterPartner = '';
  expandedId: number | null = null;

  /** The action form open on the expanded row. */
  action: SupplierOrderStatus | null = null;
  partnerOrderRef = '';
  trackingNumber = '';
  carrierName = '';
  trackingUrl = '';
  note = '';
  busyId: number | null = null;
  actionError = '';
  confirmCancelId: number | null = null;

  readonly tabs = TABS;
  readonly statusLabels = SUPPLIER_STATUS_LABELS;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.http.get<DropshipPartner[]>('/api/admin/dropship/partners').subscribe({
      next: (p) => (this.partners = p || []),
      error: () => (this.partners = []),
    });
    this.load();
  }

  setTab(tab: StatusTab): void {
    this.tab = tab;
    this.expandedId = null;
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    const params: string[] = [];
    if (this.tab.statuses.length) params.push(`status=${this.tab.statuses.join(',')}`);
    if (this.filterPartner) params.push(`partnerCode=${encodeURIComponent(this.filterPartner)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    this.http.get<SupplierOrder[]>(`/api/admin/supplier-orders${query}`).subscribe({
      next: (list) => { this.orders = list || []; this.isLoading = false; },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load supplier orders.';
      },
    });
  }

  partnerName(code: string, fallback?: string | null): string {
    return this.partners.find((p) => p.code === code)?.name || fallback || code;
  }

  statusClass(status: string): string {
    if (status === 'FAILED') return 'is-failed';
    if (status === 'AWAITING_MANUAL_PLACEMENT') return 'is-waiting';
    if (status === 'DELIVERED' || status === 'SHIPPED') return 'is-done';
    if (status === 'CANCELLED') return 'is-off';
    return 'is-progress';
  }

  toggle(o: SupplierOrder): void {
    this.expandedId = this.expandedId === o.id ? null : o.id;
    this.closeAction();
  }

  openAction(o: SupplierOrder, status: SupplierOrderStatus): void {
    this.action = status;
    this.actionError = '';
    this.partnerOrderRef = o.partnerOrderRef || '';
    this.trackingNumber = o.trackingNumber || '';
    this.carrierName = o.carrierName || '';
    this.trackingUrl = o.trackingUrl || '';
    this.note = '';
  }

  closeAction(): void {
    this.action = null;
    this.actionError = '';
    this.confirmCancelId = null;
  }

  submitAction(o: SupplierOrder): void {
    if (!this.action) return;
    if (this.action === 'SHIPPED' && !this.trackingNumber.trim()) {
      this.actionError = 'A tracking number is required to mark this shipped.';
      return;
    }
    const body = {
      status: this.action,
      partnerOrderRef: this.partnerOrderRef.trim() || null,
      trackingNumber: this.trackingNumber.trim() || null,
      carrierName: this.carrierName.trim() || null,
      trackingUrl: this.trackingUrl.trim() || null,
      note: this.note.trim() || null,
    };
    this.busyId = o.id;
    this.actionError = '';
    this.http.put<SupplierOrder>(`/api/admin/supplier-orders/${o.id}/status`, body).subscribe({
      next: () => {
        this.busyId = null;
        this.closeAction();
        this.notify.show(`Supplier order #${o.id} is now ${this.statusLabels[body.status].toLowerCase()}.`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.actionError = err.error?.error || 'Could not update that supplier order.';
      },
    });
  }

  retry(o: SupplierOrder): void {
    this.busyId = o.id;
    this.http.post<SupplierOrder>(`/api/admin/supplier-orders/${o.id}/retry`, {}).subscribe({
      next: () => {
        this.busyId = null;
        this.notify.show(`Supplier order #${o.id} resubmitted.`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.notify.show(err.error?.error || 'Could not retry that supplier order.', 'error');
      },
    });
  }

  costOf(o: SupplierOrder): number {
    if (o.costTotal != null) return o.costTotal;
    return (o.lines || []).reduce((sum, l) => sum + (l.unitCost || 0) * (l.quantity || 0), 0);
  }
}
