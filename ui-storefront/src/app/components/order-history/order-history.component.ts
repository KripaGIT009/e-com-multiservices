import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrderHistoryService, Order } from '../../services/order-history.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTabsModule, MatExpansionModule],
  template: `
    <div class="order-history-container">
      <div class="header">
        <h1>Order History</h1>
        <p class="subtitle">Track and manage your orders</p>
      </div>

      <mat-tab-group>
        <mat-tab label="All Orders">
          <div class="tab-content">
            <div class="orders-list" *ngIf="orders.length > 0; else noOrders">
              <mat-expansion-panel *ngFor="let order of orders" class="order-panel">
                <mat-expansion-panel-header>
                  <div class="order-header-content">
                    <div class="order-number">
                      <strong>Order #{{ order.orderNumber }}</strong>
                      <span class="order-date">{{ order.createdAt | date:'short' }}</span>
                    </div>
                    <div class="order-status" [ngClass]="'status-' + order.status">
                      {{ order.status | uppercase }}
                    </div>
                    <div class="order-amount">
                      <strong>₹{{ order.totalAmount }}</strong>
                    </div>
                  </div>
                </mat-expansion-panel-header>

                <div class="order-details">
                  <div class="items-section">
                    <h4>Items</h4>
                    <div class="items-list">
                      <div *ngFor="let item of order.items" class="item-row">
                        <span class="item-name">{{ item.itemName }}</span>
                        <span class="item-qty">Qty: {{ item.quantity }}</span>
                        <span class="item-price">₹{{ item.price }} x {{ item.quantity }}</span>
                        <span class="item-subtotal">₹{{ item.subtotal }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="shipping-section" *ngIf="order.shippingAddress">
                    <h4>Shipping Address</h4>
                    <p>{{ order.shippingAddress }}</p>
                  </div>

                  <div class="tracking-section" *ngIf="order.trackingNumber">
                    <h4>Tracking Number</h4>
                    <p class="tracking-number">{{ order.trackingNumber }}</p>
                  </div>

                  <div class="order-actions">
                    <button mat-raised-button color="primary">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    <button mat-raised-button color="accent" *ngIf="order.status === 'pending'">
                      <mat-icon>close</mat-icon>
                      Cancel Order
                    </button>
                    <button mat-raised-button color="primary">
                      <mat-icon>shopping_bag</mat-icon>
                      Reorder
                    </button>
                  </div>
                </div>
              </mat-expansion-panel>
            </div>
            <ng-template #noOrders>
              <div class="empty-state">
                <mat-icon class="empty-icon">shopping_bag</mat-icon>
                <h3>No orders yet</h3>
                <p>Start shopping to see your order history here</p>
                <button mat-raised-button color="primary" routerLink="/products">
                  Continue Shopping
                </button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="Active Orders">
          <div class="tab-content">
            <div class="orders-list" *ngIf="activeOrders.length > 0; else noActive">
              <div *ngFor="let order of activeOrders" class="order-card">
                <div class="card-header">
                  <span class="order-id">Order #{{ order.orderNumber }}</span>
                  <span class="status" [ngClass]="'status-' + order.status">
                    {{ order.status | uppercase }}
                  </span>
                </div>
                <div class="card-body">
                  <p><strong>Total:</strong> ₹{{ order.totalAmount }}</p>
                  <p><strong>Items:</strong> {{ order.items.length }}</p>
                  <p><strong>Ordered:</strong> {{ order.createdAt | date:'short' }}</p>
                </div>
              </div>
            </div>
            <ng-template #noActive>
              <div class="empty-state">
                <p>No active orders</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="Delivered">
          <div class="tab-content">
            <div class="orders-list" *ngIf="deliveredOrders.length > 0; else noDelivered">
              <div *ngFor="let order of deliveredOrders" class="order-card completed">
                <div class="card-header">
                  <span class="order-id">Order #{{ order.orderNumber }}</span>
                  <span class="badge-success">
                    <mat-icon>check_circle</mat-icon> Delivered
                  </span>
                </div>
                <div class="card-body">
                  <p><strong>Total:</strong> ₹{{ order.totalAmount }}</p>
                  <p><strong>Delivered:</strong> {{ order.updatedAt | date:'short' }}</p>
                </div>
              </div>
            </div>
            <ng-template #noDelivered>
              <div class="empty-state">
                <p>No delivered orders</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .order-history-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 30px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 15px;
    }

    .header h1 {
      color: #232f3e;
      margin: 0 0 5px 0;
      font-size: 28px;
    }

    .subtitle {
      color: #666;
      margin: 0;
      font-size: 14px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .order-panel {
      margin-bottom: 0 !important;
      border: 1px solid #ddd !important;
      border-radius: 4px !important;
    }

    .order-header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
      gap: 20px;
      padding: 10px 0;
    }

    .order-number {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .order-number strong {
      color: #232f3e;
      font-size: 16px;
    }

    .order-date {
      color: #888;
      font-size: 12px;
    }

    .order-status {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }

    .status-pending {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-confirmed {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    .status-shipped {
      background-color: #cce5ff;
      color: #004085;
    }

    .status-delivered {
      background-color: #d4edda;
      color: #155724;
    }

    .status-cancelled {
      background-color: #f8d7da;
      color: #721c24;
    }

    .order-amount {
      text-align: right;
    }

    .order-amount strong {
      color: #ff9900;
      font-size: 16px;
    }

    .order-details {
      padding: 20px;
      background-color: #f9f9f9;
    }

    .items-section, .shipping-section, .tracking-section {
      margin-bottom: 20px;
    }

    .items-section h4, .shipping-section h4, .tracking-section h4 {
      color: #232f3e;
      margin-bottom: 10px;
      font-size: 14px;
      font-weight: 600;
    }

    .items-list {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .item-row:last-child {
      border-bottom: none;
    }

    .item-name {
      flex: 1;
      font-weight: 500;
    }

    .item-qty, .item-price, .item-subtotal {
      color: #666;
      text-align: right;
    }

    .shipping-section p, .tracking-section p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .tracking-number {
      font-family: monospace;
      background: white;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .order-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .order-actions button {
      flex: 1;
    }

    .order-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .order-card.completed {
      background: #f0fff4;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 1;
    }

    .order-id {
      font-weight: 600;
      color: #232f3e;
    }

    .badge-success {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #155724;
      background: #d4edda;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge-success mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .card-body {
      flex: 1;
      margin: 0 20px;
      color: #666;
      font-size: 14px;
    }

    .card-body p {
      margin: 5px 0;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin: 0 auto 20px;
    }

    .empty-state h3 {
      color: #232f3e;
      margin: 10px 0;
    }

    .empty-state p {
      margin: 10px 0 20px 0;
    }
  `]
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  activeOrders: Order[] = [];
  deliveredOrders: Order[] = [];
  loading = false;

  constructor(private orderService: OrderHistoryService) {}

  ngOnInit(): void {
    // Mock data for demonstration
    this.orders = [
      {
        id: 1,
        orderNumber: '1001',
        userId: 1,
        items: [
          { id: 1, itemId: 10, itemName: 'Laptop', quantity: 1, price: 45000, subtotal: 45000 },
          { id: 2, itemId: 11, itemName: 'Mouse', quantity: 2, price: 500, subtotal: 1000 }
        ],
        totalAmount: 46000,
        status: 'delivered',
        createdAt: new Date('2024-01-10').toISOString(),
        updatedAt: new Date('2024-01-15').toISOString(),
        shippingAddress: '123 Main Street, Mumbai, India 400001',
        trackingNumber: 'TRK123456789'
      },
      {
        id: 2,
        orderNumber: '1002',
        userId: 1,
        items: [
          { id: 3, itemId: 12, itemName: 'Keyboard', quantity: 1, price: 2000, subtotal: 2000 }
        ],
        totalAmount: 2000,
        status: 'shipped',
        createdAt: new Date('2024-01-20').toISOString(),
        updatedAt: new Date('2024-01-21').toISOString(),
        shippingAddress: '123 Main Street, Mumbai, India 400001',
        trackingNumber: 'TRK987654321'
      }
    ];

    this.activeOrders = this.orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status));
    this.deliveredOrders = this.orders.filter(o => o.status === 'delivered');
  }
}
