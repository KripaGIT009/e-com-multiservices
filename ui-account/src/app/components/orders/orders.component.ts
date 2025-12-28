import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="container">
      <mat-card class="orders-card">
        <mat-card-header>
          <mat-card-title>Order History</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="error" class="error-message">{{ error }}</div>

          <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>

          <table mat-table [dataSource]="orders" class="orders-table" *ngIf="!loading && orders.length > 0">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Order ID</th>
              <td mat-cell *matCellDef="let order">{{ order.id }}</td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let order">{{ order.date | date }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let order">\${{ order.amount }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let order">{{ order.status }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let order">
                <button mat-button color="primary" (click)="viewOrder(order.id)">View</button>
                <button mat-button color="warn" (click)="cancelOrder(order.id)" *ngIf="order.status === 'Pending'">Cancel</button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div *ngIf="!loading && orders.length === 0" class="no-orders">
            <p>No orders yet</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 2rem auto;
    }
    .orders-card {
      padding: 2rem;
    }
    .orders-table {
      width: 100%;
    }
    .error-message {
      color: #d32f2f;
      background-color: #ffebee;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .no-orders {
      text-align: center;
      padding: 2rem;
      color: #999;
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  error: string | null = null;
  displayedColumns = ['id', 'date', 'amount', 'status', 'actions'];

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;
    this.orderService.getUserOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load orders';
        this.loading = false;
      }
    });
  }

  viewOrder(id: string): void {
    window.location.href = `/orders/${id}`;
  }

  cancelOrder(id: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.orderService.cancelOrder(id).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: () => {
          this.error = 'Failed to cancel order';
        }
      });
    }
  }
}
