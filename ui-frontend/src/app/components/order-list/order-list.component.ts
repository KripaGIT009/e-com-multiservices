import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Order Management</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="orders" class="mat-elevation-z8 full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Order ID</th>
              <td mat-cell *matCellDef="let order">{{order.id}}</td>
            </ng-container>
            
            <ng-container matColumnDef="orderNumber">
              <th mat-header-cell *matHeaderCellDef>Order Number</th>
              <td mat-cell *matCellDef="let order">{{order.orderNumber}}</td>
            </ng-container>
            
            <ng-container matColumnDef="customerId">
              <th mat-header-cell *matHeaderCellDef>Customer</th>
              <td mat-cell *matCellDef="let order">{{order.customerId}}</td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let order">
                <mat-chip [class]="getStatusClass(order.status)">
                  {{order.status}}
                </mat-chip>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let order">{{order.totalAmount | currency}}</td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let order">
                <button mat-icon-button color="primary">
                  <mat-icon>visibility</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .mat-chip.pending { background-color: #ff9800; color: white; }
    .mat-chip.completed { background-color: #4caf50; color: white; }
    .mat-chip.cancelled { background-color: #f44336; color: white; }
  `]
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];
  displayedColumns: string[] = ['id', 'orderNumber', 'customerId', 'status', 'totalAmount', 'actions'];

  constructor(
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService.getAllOrders().subscribe({
      next: (data) => {
        this.orders = Array.isArray(data) ? data : [];
      },
      error: (error) => {
        this.snackBar.open('Error loading orders', 'Close', { duration: 3000 });
        this.orders = [];
      }
    });
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() || 'pending';
  }
}
