import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReturnService, Return } from '../../services/return.service';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="ret-page">
      <div class="page-header">
        <div>
          <h2>Returns</h2>
          <p class="page-sub">{{ returns.length }} return requests</p>
        </div>
        <button class="add-btn" (click)="toggleForm()">
          {{ showCreateForm ? '✕ Cancel' : '+ Create Return' }}
        </button>
      </div>

      <div class="add-form" *ngIf="showCreateForm">
        <h3>New Return Request</h3>
        <div class="form-row">
          <div class="form-field">
            <label>Order ID *</label>
            <input type="text" [(ngModel)]="newReturn.orderId" placeholder="ORD-12345" />
          </div>
          <div class="form-field">
            <label>Reason *</label>
            <input type="text" [(ngModel)]="newReturn.reason" placeholder="Reason for return..." />
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" (click)="toggleForm()">Cancel</button>
          <button class="save-btn" (click)="createReturn()" [disabled]="!newReturn.orderId || !newReturn.reason">Submit</button>
        </div>
      </div>

      <div class="filter-bar">
        <input type="text" placeholder="Search by return ID or order ID..."
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()" />
        <div class="status-chips">
          <button class="chip" [class.active]="statusFilter === ''" (click)="setFilter('')">All</button>
          <button class="chip pending" [class.active]="statusFilter === 'PENDING'" (click)="setFilter('PENDING')">PENDING</button>
          <button class="chip approved" [class.active]="statusFilter === 'APPROVED'" (click)="setFilter('APPROVED')">APPROVED</button>
          <button class="chip rejected" [class.active]="statusFilter === 'REJECTED'" (click)="setFilter('REJECTED')">REJECTED</button>
          <button class="chip refunded" [class.active]="statusFilter === 'REFUNDED'" (click)="setFilter('REFUNDED')">REFUNDED</button>
        </div>
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Loading returns...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">↩️</div>
        <h3>No returns found</h3>
        <p>No return requests match your filters</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && filtered.length > 0">
        <table class="ret-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Refund Amount</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ret of filtered">
              <td><span class="id-badge">{{ ret.returnId || ret.id }}</span></td>
              <td>{{ ret.orderId }}</td>
              <td class="reason-col">{{ ret.reason }}</td>
              <td><span class="status-badge" [ngClass]="'status-' + (ret.status || 'unknown').toLowerCase()">{{ ret.status }}</span></td>
              <td>{{ ret.refundAmount ? ('₹' + ret.refundAmount) : '—' }}</td>
              <td class="date-col">{{ ret.createdAt | date:'mediumDate' }}</td>
              <td class="action-col">
                <ng-container [ngSwitch]="ret.status">
                  <ng-container *ngSwitchCase="'PENDING'">
                    <button class="act-btn approve" (click)="resolve(ret.id, 'APPROVE')">✓ Approve</button>
                    <button class="act-btn reject" (click)="resolve(ret.id, 'REJECT')">✗ Reject</button>
                  </ng-container>
                  <ng-container *ngSwitchCase="'APPROVED'">
                    <button class="act-btn refund" (click)="resolve(ret.id, 'REFUND')">↩ Refund</button>
                  </ng-container>
                  <ng-container *ngSwitchDefault>
                    <span class="no-action">—</span>
                  </ng-container>
                </ng-container>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .ret-page { padding: 24px; background: #f0f2f2; min-height: 100%; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 4px; }
    .page-sub { font-size: 12px; color: #666; margin: 0; }
    .add-btn { background: #ff9900; border: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #111; font-weight: 600; }
    .add-btn:hover { background: #e68900; }
    .add-form { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .add-form h3 { margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #111; }
    .form-row { display: flex; gap: 12px; margin-bottom: 16px; }
    .form-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 12px; font-weight: 600; color: #555; }
    .form-field input { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; }
    .form-field input:focus { border-color: #ff9900; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .cancel-btn { background: #fff; border: 1px solid #d5d9d9; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; }
    .save-btn { background: #ff9900; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #111; font-weight: 600; }
    .save-btn:disabled { background: #ddd; cursor: not-allowed; }
    .filter-bar { background: #fff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .filter-bar input { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; width: 260px; outline: none; }
    .filter-bar input:focus { border-color: #ff9900; }
    .status-chips { display: flex; gap: 6px; }
    .chip { border: 1px solid #d5d9d9; background: #fff; border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer; font-weight: 600; color: #555; }
    .chip.active { background: #ff9900; border-color: #ff9900; color: #111; }
    .chip.pending.active { background: #856404; border-color: #856404; color: #fff; }
    .chip.approved.active { background: #155724; border-color: #155724; color: #fff; }
    .chip.rejected.active { background: #721c24; border-color: #721c24; color: #fff; }
    .chip.refunded.active { background: #533f7a; border-color: #533f7a; color: #fff; }
    .loading-wrap { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; background: #fff; border-radius: 8px; color: #666; font-size: 14px; }
    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #555; margin: 0 0 8px; }
    .empty-state p { color: #888; margin: 0; }
    .table-wrap { background: #fff; border-radius: 8px; border: 1px solid #e5e5e5; overflow-x: auto; }
    .ret-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ret-table thead tr { background: #f7f7f7; border-bottom: 2px solid #e5e5e5; }
    .ret-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .ret-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .ret-table tr:last-child td { border-bottom: none; }
    .ret-table tr:hover td { background: #fafafa; }
    .id-badge { font-size: 11px; color: #888; font-family: monospace; }
    .reason-col { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-col { color: #888; font-size: 12px; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .status-pending { background: #fff3cd; color: #856404; }
    .status-approved { background: #d4edda; color: #155724; }
    .status-rejected { background: #f8d7da; color: #721c24; }
    .status-refunded { background: #e2d4f0; color: #533f7a; }
    .status-unknown { background: #e5e5e5; color: #555; }
    .action-col { white-space: nowrap; }
    .no-action { color: #aaa; }
    .act-btn { border: none; border-radius: 4px; padding: 4px 10px; font-size: 12px; cursor: pointer; font-weight: 600; margin-right: 4px; }
    .act-btn.approve { background: #d4edda; color: #155724; }
    .act-btn.approve:hover { background: #c3e6cb; }
    .act-btn.reject { background: #f8d7da; color: #721c24; }
    .act-btn.reject:hover { background: #f5c6cb; }
    .act-btn.refund { background: #e2d4f0; color: #533f7a; }
    .act-btn.refund:hover { background: #d6c4e8; }
  `]
})
export class ReturnListComponent implements OnInit {
  returns: Return[] = [];
  filtered: Return[] = [];
  loading = false;
  searchQuery = '';
  statusFilter = '';
  showCreateForm = false;
  newReturn = { orderId: '', reason: '' };

  constructor(
    private returnService: ReturnService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading = true;
    this.returnService.getAllReturns().subscribe({
      next: (data) => {
        this.returns = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error loading returns', 'Close', { duration: 3000 });
        this.returns = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) this.newReturn = { orderId: '', reason: '' };
  }

  createReturn(): void {
    if (!this.newReturn.orderId || !this.newReturn.reason) return;
    this.returnService.createReturn(this.newReturn.orderId, this.newReturn.reason).subscribe({
      next: () => {
        this.snackBar.open('Return request created', 'Close', { duration: 3000 });
        this.showCreateForm = false;
        this.newReturn = { orderId: '', reason: '' };
        this.loadReturns();
      },
      error: () => {
        this.snackBar.open('Error creating return', 'Close', { duration: 3000 });
      }
    });
  }

  resolve(id: any, action: 'APPROVE' | 'REJECT' | 'REFUND'): void {
    this.returnService.resolveReturnAction(id, action).subscribe({
      next: () => {
        this.snackBar.open(`Return ${action.toLowerCase()}d`, 'Close', { duration: 3000 });
        this.loadReturns();
      },
      error: () => {
        this.snackBar.open(`Error: could not ${action.toLowerCase()}`, 'Close', { duration: 3000 });
      }
    });
  }

  setFilter(s: string): void {
    this.statusFilter = s;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.returns];
    if (this.statusFilter) {
      result = result.filter(r => r.status === this.statusFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.returnId || '').toLowerCase().includes(q) ||
        (r.orderId || '').toLowerCase().includes(q)
      );
    }
    this.filtered = result;
  }
}
