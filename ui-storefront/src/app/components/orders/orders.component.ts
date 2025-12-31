import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="orders-container">
      <div class="orders-header">
        <h1>
          <mat-icon>receipt_long</mat-icon>
          Your Orders
        </h1>
        <p>Track, return, or buy things again</p>
      </div>

      <div class="orders-content" *ngIf="orders.length > 0; else noOrders">
        <mat-card *ngFor="let order of orders" class="order-card">
          <mat-card-header>
            <div class="order-header-content">
              <div class="order-info">
                <div class="order-id">Order #{{ order.id }}</div>
                <div class="order-date">{{ order.createdAt | date:'medium' }}</div>
              </div>
              <mat-chip [class]="'status-' + order.status.toLowerCase()">
                {{ order.status }}
              </mat-chip>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="order-items" *ngIf="order.items && order.items.length > 0">
              <div class="order-item" *ngFor="let item of order.items">
                <mat-icon>shopping_bag</mat-icon>
                <div class="item-details">
                  <div class="item-name">{{ item.name || 'Item #' + item.itemId }}</div>
                  <div class="item-quantity">Quantity: {{ item.quantity }}</div>
                </div>
                <div class="item-price">₹{{ item.price || 0 }}</div>
              </div>
            </div>
            <div class="order-total">
              <strong>Total:</strong>
              <span class="total-amount">₹{{ order.totalAmount || 0 }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" (click)="viewOrder(order.id)">
              <mat-icon>visibility</mat-icon>
              View Details
            </button>
            <button mat-button (click)="trackOrder(order.id)" *ngIf="order.status !== 'DELIVERED'">
              <mat-icon>local_shipping</mat-icon>
              Track Order
            </button>
            <button mat-button *ngIf="order.status === 'DELIVERED'">
              <mat-icon>replay</mat-icon>
              Buy Again
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #noOrders>
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <h2>No orders yet</h2>
          <p>Start shopping and your orders will appear here</p>
          <button mat-raised-button color="primary" (click)="goToShopping()">
            <mat-icon>shopping_cart</mat-icon>
            Start Shopping
          </button>
        </div>
      </ng-template>

      <div class="loading" *ngIf="loading">
        <mat-icon>refresh</mat-icon>
        Loading orders...
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .orders-header {
      margin-bottom: 32px;
    }

    .orders-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 32px;
      margin: 0 0 8px 0;
      color: #111;
    }

    .orders-header p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .orders-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .order-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .order-header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-id {
      font-weight: 700;
      font-size: 16px;
      color: #111;
    }

    .order-date {
      font-size: 13px;
      color: #666;
    }

    .order-items {
      margin: 16px 0;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      font-weight: 600;
      color: #111;
      margin-bottom: 4px;
    }

    .item-quantity {
      font-size: 13px;
      color: #666;
    }

    .item-price {
      font-weight: 700;
      color: #ff9900;
    }

    .order-total {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 16px;
      padding-top: 16px;
      border-top: 2px solid #f0f0f0;
      font-size: 16px;
    }

    .total-amount {
      font-size: 20px;
      font-weight: 700;
      color: #ff9900;
    }

    mat-chip {
      font-size: 12px;
      font-weight: 600;
    }

    .status-pending {
      background: #fff3cd !important;
      color: #856404 !important;
    }

    .status-processing {
      background: #d1ecf1 !important;
      color: #0c5460 !important;
    }

    .status-shipped {
      background: #cfe2ff !important;
      color: #084298 !important;
    }

    .status-delivered {
      background: #d1e7dd !important;
      color: #0f5132 !important;
    }

    .status-cancelled {
      background: #f8d7da !important;
      color: #842029 !important;
    }

    .empty-state {
      text-align: center;
      padding: 80px 24px;
    }

    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      color: #111;
      margin: 16px 0 8px 0;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 24px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .loading mat-icon {
      animation: spin 2s linear infinite;
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .order-header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    // Call order-service endpoint at port 8001
    this.http.get<any[]>(`http://localhost:8001/api/v1/orders/user/${userId}`).subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.loading = false;
        // For demo, show empty state
        this.orders = [];
      }
    });
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  trackOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId, 'track']);
  }

  goToShopping(): void {
    this.router.navigate(['/products']);
  }
}
