import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService, Payment } from '../../services/payment.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="pay-page">
      <div class="page-header">
        <div>
          <h2>Payments</h2>
          <p class="page-sub">{{ payments.length }} payment records</p>
        </div>
        <button class="refresh-btn" (click)="loadPayments()">&#x21bb; Refresh</button>
      </div>

      <div class="filter-bar">
        <input type="text" placeholder="Search by order ID or transaction ID..."
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()" />
        <div class="status-chips">
          <button class="chip" [class.active]="statusFilter === ''" (click)="setFilter('')">All</button>
          <button class="chip pending" [class.active]="statusFilter === 'PENDING'" (click)="setFilter('PENDING')">PENDING</button>
          <button class="chip completed" [class.active]="statusFilter === 'COMPLETED'" (click)="setFilter('COMPLETED')">COMPLETED</button>
          <button class="chip processing" [class.active]="statusFilter === 'PROCESSING'" (click)="setFilter('PROCESSING')">PROCESSING</button>
          <button class="chip failed" [class.active]="statusFilter === 'FAILED'" (click)="setFilter('FAILED')">FAILED</button>
          <button class="chip refunded" [class.active]="statusFilter === 'REFUNDED'" (click)="setFilter('REFUNDED')">REFUNDED</button>
        </div>
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Loading payments...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">&#x1F4B3;</div>
        <h3>No payments found</h3>
        <p>No payment records match your filters</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && filtered.length > 0">
        <table class="pay-table">
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Transaction ID</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtered">
              <td><span class="pay-id">#{{ p.id }}</span></td>
              <td>{{ p.orderId }}</td>
              <td class="amount-col">&#x20B9;{{ p.amount | number:'1.2-2' }}</td>
              <td>{{ p.paymentMethod || '—' }}</td>
              <td><span class="status-badge" [ngClass]="getStatusClass(p.status)">{{ p.status }}</span></td>
              <td class="txn-col">{{ p.transactionId || '—' }}</td>
              <td class="date-col">{{ p.createdAt | date:'mediumDate' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .pay-page { padding: 24px; background: #f0f2f2; min-height: 100%; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 4px; }
    .page-sub { font-size: 12px; color: #666; margin: 0; }
    .refresh-btn { background: #fff; border: 1px solid #d5d9d9; padding: 9px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #333; font-weight: 600; }
    .refresh-btn:hover { background: #f7f7f7; }
    .filter-bar { background: #fff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .filter-bar input { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; width: 260px; outline: none; }
    .filter-bar input:focus { border-color: #ff9900; }
    .status-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { border: 1px solid #d5d9d9; background: #fff; border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer; font-weight: 600; color: #555; }
    .chip.active { background: #ff9900; border-color: #ff9900; color: #111; }
    .chip.pending.active { background: #856404; border-color: #856404; color: #fff; }
    .chip.completed.active { background: #155724; border-color: #155724; color: #fff; }
    .chip.processing.active { background: #0c5460; border-color: #0c5460; color: #fff; }
    .chip.failed.active { background: #721c24; border-color: #721c24; color: #fff; }
    .chip.refunded.active { background: #533f7a; border-color: #533f7a; color: #fff; }
    .loading-wrap { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; background: #fff; border-radius: 8px; color: #666; font-size: 14px; }
    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #555; margin: 0 0 8px; }
    .empty-state p { color: #888; margin: 0; }
    .table-wrap { background: #fff; border-radius: 8px; border: 1px solid #e5e5e5; overflow-x: auto; }
    .pay-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .pay-table thead tr { background: #f7f7f7; border-bottom: 2px solid #e5e5e5; }
    .pay-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .pay-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .pay-table tr:last-child td { border-bottom: none; }
    .pay-table tr:hover td { background: #fafafa; }
    .pay-id { font-size: 11px; color: #888; }
    .amount-col { font-weight: 700; color: #111; }
    .txn-col { font-size: 11px; color: #888; font-family: monospace; }
    .date-col { color: #888; font-size: 12px; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-completed, .status-success { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-failed, .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-processing { background: #d1ecf1; color: #0c5460; }
    .status-refunded { background: #e2d4f0; color: #533f7a; }
  `]
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];
  filtered: Payment[] = [];
  loading = false;
  searchQuery = '';
  statusFilter = '';

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getAllPayments().subscribe({
      next: (data) => {
        this.payments = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error loading payments', 'Close', { duration: 3000 });
        this.payments = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  setFilter(s: string): void {
    this.statusFilter = s;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.payments];
    if (this.statusFilter) {
      result = result.filter(p => p.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.orderId || '').toLowerCase().includes(q) ||
        (p.transactionId || '').toLowerCase().includes(q)
      );
    }
    this.filtered = result;
  }

  getStatusClass(status: string): string {
    return 'status-' + (status || 'unknown').toLowerCase();
  }
}
