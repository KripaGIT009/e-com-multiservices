import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService, OrderWorkflowActionsResponse } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="orders-page">

      <!-- ── PAGE HEADER ──────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h2>Order Management</h2>
          <p class="page-sub">{{ filteredOrders.length }} orders &bull; Updated just now</p>
        </div>
        <button class="refresh-btn" (click)="loadOrders()">&#10227; Refresh</button>
      </div>

      <!-- ── FILTER BAR ───────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="search-wrap">
          <input type="text" placeholder="Search by order #, customer..."
                 [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" />
        </div>
        <div class="status-filters">
          <button class="sf-btn" [class.active]="selectedStatus === null"
                  (click)="filterByStatus(null)">All</button>
          <button class="sf-btn" *ngFor="let s of statusOptions"
                  [class.active]="selectedStatus === s"
                  (click)="filterByStatus(s)">{{ s }}</button>
        </div>
      </div>

      <!-- ── LOADING / EMPTY ──────────────────────────────────── -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Loading orders...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && filteredOrders.length === 0">
        <div class="empty-icon">&#128722;</div>
        <h3>No orders found</h3>
        <p>Try adjusting your search or filter</p>
      </div>

      <!-- ── ORDERS TABLE ─────────────────────────────────────── -->
      <div class="table-wrap" *ngIf="!loading && filteredOrders.length > 0">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Order Details</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Next Action</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders" [class.highlighted]="selectedOrderId === order.id">
              <td>
                <div class="order-id">#{{ order.orderNumber || order.id }}</div>
                <div class="order-date">{{ (order.createdAt | date:'dd MMM yyyy') || 'N/A' }}</div>
              </td>
              <td>
                <div class="customer-avatar">{{ getInitial(order.customerId) }}</div>
                <span class="customer-id">{{ order.customerId }}</span>
              </td>
              <td>
                <span class="status-badge" [class]="'status-' + (order.status || 'pending').toLowerCase()">
                  {{ order.status || 'Pending' }}
                </span>
              </td>
              <td>
                <span class="next-action-chip" *ngIf="getNextRecommendedAction(order.id) as action">
                  {{ formatAction(action) }}
                </span>
                <span class="no-action" *ngIf="!getNextRecommendedAction(order.id)">—</span>
              </td>
              <td>
                <div class="order-amount">₹{{ (order.totalAmount || 0) | number:'1.0-0' }}</div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="act-btn primary" [matMenuTriggerFor]="workflowMenu"
                          (click)="selectOrder(order)" title="Workflow Actions">
                    &#9881; Actions
                  </button>
                  <button class="act-btn icon" (click)="loadWorkflowActions(order.id)"
                          title="Refresh workflow">
                    &#10227;
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- WORKFLOW CONTEXT MENU -->
      <mat-menu #workflowMenu="matMenu">
        <ng-container *ngIf="selectedOrderId !== null">
          <ng-container *ngIf="getActionsForSelectedOrder().length > 0; else noActions">
            <button mat-menu-item *ngFor="let action of getActionsForSelectedOrder()"
                    (click)="executeAction(action)">
              <span class="menu-action-icon">{{ getActionIcon(action) }}</span>
              {{ formatAction(action) }}
            </button>
          </ng-container>
          <ng-template #noActions>
            <button mat-menu-item disabled>No actions available</button>
          </ng-template>
        </ng-container>
      </mat-menu>

    </div>
  `,
  styles: [`
    .orders-page {
      padding: 24px;
      background: #f0f2f2;
      min-height: 100%;
    }
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .page-header h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #111;
      margin: 0 0 4px;
    }
    .page-sub { font-size: 12px; color: #666; margin: 0; }
    .refresh-btn {
      background: #fff;
      border: 1px solid #d5d9d9;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: #333;
    }
    .refresh-btn:hover { background: #f7f7f7; }

    /* FILTER BAR */
    .filter-bar {
      background: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-wrap input {
      border: 1px solid #d5d9d9;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      width: 240px;
      outline: none;
    }
    .search-wrap input:focus { border-color: #ff9900; }
    .status-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .sf-btn {
      padding: 5px 14px;
      border: 1px solid #d5d9d9;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      background: #fff;
      color: #444;
      transition: all 0.15s;
    }
    .sf-btn:hover { border-color: #ff9900; color: #c45500; }
    .sf-btn.active { background: #ff9900; border-color: #ff9900; color: #111; font-weight: 600; }

    /* LOADING / EMPTY */
    .loading-wrap {
      display: flex; align-items: center; gap: 12px;
      padding: 40px; justify-content: center;
      background: #fff; border-radius: 8px;
      color: #666; font-size: 14px;
    }
    .empty-state {
      text-align: center; padding: 60px 20px;
      background: #fff; border-radius: 8px;
    }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #555; margin: 0 0 8px; }
    .empty-state p { color: #888; margin: 0; }

    /* TABLE */
    .table-wrap {
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
      overflow-x: auto;
    }
    .orders-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .orders-table thead tr {
      background: #f7f7f7;
      border-bottom: 2px solid #e5e5e5;
    }
    .orders-table th {
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .orders-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }
    .orders-table tr:last-child td { border-bottom: none; }
    .orders-table tr.highlighted td { background: #fff8ee; }
    .orders-table tr:hover td { background: #fafafa; }

    .order-id { font-weight: 600; color: #0066c0; font-size: 13px; }
    .order-date { font-size: 11px; color: #888; margin-top: 2px; }

    td:nth-child(2) { display: flex; align-items: center; gap: 8px; }
    .customer-avatar {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #232f3e;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .customer-id { color: #333; font-size: 12px; }

    /* STATUS BADGES */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }
    .status-pending   { background: #fff3cd; color: #856404; }
    .status-confirmed { background: #d1ecf1; color: #0c5460; }
    .status-processing { background: #cce5ff; color: #004085; }
    .status-shipped   { background: #d4edda; color: #155724; }
    .status-delivered { background: #c3e6cb; color: #155724; }
    .status-cancelled { background: #f8d7da; color: #721c24; }
    .status-returned  { background: #e2d9f3; color: #3d1a78; }

    .next-action-chip {
      background: #e3f2fd;
      color: #1565c0;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .no-action { color: #bbb; font-size: 12px; }

    .order-amount { font-weight: 700; color: #111; font-size: 14px; }

    .action-btns { display: flex; gap: 6px; align-items: center; }
    .act-btn {
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.15s;
    }
    .act-btn.primary { background: #ff9900; color: #111; }
    .act-btn.primary:hover { background: #e68900; }
    .act-btn.icon {
      background: #f5f5f5;
      color: #333;
      padding: 6px 8px;
    }
    .act-btn.icon:hover { background: #e5e5e5; }
    .menu-action-icon { margin-right: 6px; }

    @media (max-width: 768px) {
      .orders-page { padding: 12px; }
      .search-wrap input { width: 180px; }
    }
  `]
})

export class OrderListComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  loading = false;
  searchQuery = '';
  selectedStatus: string | null = null;
  statusOptions = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  selectedOrderId: number | null = null;
  private workflowActionMap: Record<number, OrderWorkflowActionsResponse> = {};

  constructor(
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = Array.isArray(data) ? data : [];
        this.workflowActionMap = {};
        this.applyFilters();
        this.loading = false;
        this.orders.forEach(order => {
          if (order?.id) {
            this.loadWorkflowActions(order.id, false);
          }
        });
      },
      error: () => {
        this.snackBar.open('Error loading orders', 'Close', { duration: 3000 });
        this.orders = [];
        this.filteredOrders = [];
        this.workflowActionMap = {};
        this.loading = false;
      }
    });
  }

  filterByStatus(status: string | null): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.orders];
    if (this.selectedStatus) {
      result = result.filter(o => (o.status || '').toUpperCase() === this.selectedStatus);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        String(o.orderNumber || o.id || '').toLowerCase().includes(q) ||
        String(o.customerId || '').toLowerCase().includes(q)
      );
    }
    this.filteredOrders = result;
  }

  getInitial(customerId: any): string {
    return String(customerId || '?').charAt(0).toUpperCase();
  }

  getActionIcon(action: string): string {
    const a = (action || '').toUpperCase();
    if (a.includes('SHIP')) return '🚚';
    if (a.includes('DELIVER')) return '✅';
    if (a.includes('CANCEL')) return '❌';
    if (a.includes('REFUND')) return '↩️';
    if (a.includes('CONFIRM')) return '✔️';
    if (a.includes('RESERVE')) return '📦';
    return '⚙️';
  }

  selectOrder(order: any): void {
    this.selectedOrderId = order?.id ?? null;
    if (this.selectedOrderId !== null && !this.workflowActionMap[this.selectedOrderId]) {
      this.loadWorkflowActions(this.selectedOrderId);
    }
  }

  loadWorkflowActions(orderId: number, showError = true): void {
    this.orderService.getOrderWorkflowActions(orderId).subscribe({
      next: (data) => {
        this.workflowActionMap[orderId] = {
          orderId,
          currentStatus: data?.currentStatus ?? '',
          availableActions: data?.availableActions ?? [],
          recommendedAction: data?.recommendedAction,
          actionPriorities: data?.actionPriorities
        };
      },
      error: () => {
        this.workflowActionMap[orderId] = {
          orderId,
          currentStatus: '',
          availableActions: []
        };
        if (showError) {
          this.snackBar.open('Unable to fetch workflow actions', 'Close', { duration: 3000 });
        }
      }
    });
  }

  getNextRecommendedAction(orderId: number): string | null {
    const metadata = this.workflowActionMap[orderId];
    const actions = metadata?.availableActions ?? [];
    if (actions.length === 0) {
      return null;
    }

    if (metadata?.recommendedAction && actions.includes(metadata.recommendedAction)) {
      return metadata.recommendedAction;
    }

    return [...actions].sort((a, b) => this.getActionPriority(orderId, b) - this.getActionPriority(orderId, a))[0];
  }

  private getActionPriority(orderId: number, action: string): number {
    const normalized = (action || '').toUpperCase();
    const defaultPriorityMap: Record<string, number> = {
      SHIP_ORDER: 100,
      MARK_DELIVERED: 95,
      RESERVE_INVENTORY: 90,
      CONFIRM_PAYMENT: 85,
      ISSUE_REFUND: 50,
      CANCEL_ORDER: 10
    };

    const backendPriorityMap = this.workflowActionMap[orderId]?.actionPriorities;
    const priorityMap = backendPriorityMap && Object.keys(backendPriorityMap).length > 0
      ? backendPriorityMap
      : defaultPriorityMap;

    return priorityMap[normalized] ?? 1;
  }

  getActionsForSelectedOrder(): string[] {
    if (this.selectedOrderId === null) {
      return [];
    }
    return this.workflowActionMap[this.selectedOrderId]?.availableActions ?? [];
  }

  executeAction(action: string): void {
    if (this.selectedOrderId === null) {
      return;
    }

    const orderId = this.selectedOrderId;
    this.orderService.executeOrderWorkflowAction(orderId, action).subscribe({
      next: () => {
        this.snackBar.open(`Action ${this.formatAction(action)} executed`, 'Close', { duration: 2500 });
        this.loadWorkflowActions(orderId);
        this.loadOrders();
      },
      error: (error) => {
        const message = error?.error?.error || 'Unable to execute workflow action';
        this.snackBar.open(message, 'Close', { duration: 3500 });
      }
    });
  }

  formatAction(action: string): string {
    return (action || '')
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || 'pending';
  }
}
