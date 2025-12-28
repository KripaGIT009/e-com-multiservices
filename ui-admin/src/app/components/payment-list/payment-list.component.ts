import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentService, Payment } from '../../services/payment.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Payment History</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="payments" class="full-width">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let payment">{{payment.id}}</td>
          </ng-container>

          <ng-container matColumnDef="orderId">
            <th mat-header-cell *matHeaderCellDef>Order ID</th>
            <td mat-cell *matCellDef="let payment">{{payment.orderId}}</td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let payment">{{payment.amount | currency}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let payment">
              <mat-chip [color]="getStatusColor(payment.status)" selected>
                {{payment.status}}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="paymentMethod">
            <th mat-header-cell *matHeaderCellDef>Payment Method</th>
            <td mat-cell *matCellDef="let payment">{{payment.paymentMethod || 'N/A'}}</td>
          </ng-container>

          <ng-container matColumnDef="transactionId">
            <th mat-header-cell *matHeaderCellDef>Transaction ID</th>
            <td mat-cell *matCellDef="let payment">{{payment.transactionId || 'N/A'}}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let payment">{{payment.createdAt | date: 'short'}}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
    table {
      width: 100%;
    }
  `]
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];
  displayedColumns: string[] = ['id', 'orderId', 'amount', 'status', 'paymentMethod', 'transactionId', 'createdAt'];

  constructor(
    private paymentService: PaymentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        this.payments = payments;
      },
      error: () => {
        this.snackBar.open('Error loading payments', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'primary';
      case 'PENDING':
        return 'accent';
      case 'FAILED':
      case 'CANCELLED':
        return 'warn';
      default:
        return '';
    }
  }
}
