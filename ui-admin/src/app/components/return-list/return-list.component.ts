import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReturnService, Return } from '../../services/return.service';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Returns Management</mat-card-title>
        <button mat-raised-button color="primary" (click)="openCreateDialog()" style="margin-left: auto;">
          <mat-icon>add</mat-icon> Create Return
        </button>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="returns" class="full-width">
          <ng-container matColumnDef="returnId">
            <th mat-header-cell *matHeaderCellDef>Return ID</th>
            <td mat-cell *matCellDef="let return">{{return.returnId}}</td>
          </ng-container>

          <ng-container matColumnDef="orderId">
            <th mat-header-cell *matHeaderCellDef>Order ID</th>
            <td mat-cell *matCellDef="let return">{{return.orderId}}</td>
          </ng-container>

          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Reason</th>
            <td mat-cell *matCellDef="let return">{{return.reason}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let return">
              <mat-chip [color]="getStatusColor(return.status)" selected>
                {{return.status}}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="refundAmount">
            <th mat-header-cell *matHeaderCellDef>Refund Amount</th>
            <td mat-cell *matCellDef="let return">{{return.refundAmount | currency}}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let return">{{return.createdAt | date: 'short'}}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let return">
              <button mat-icon-button [matMenuTriggerFor]="menu" *ngIf="return.status === 'PENDING'">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="updateStatus(return.id, 'APPROVED')">Approve</button>
                <button mat-menu-item (click)="updateStatus(return.id, 'REJECTED')">Reject</button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <!-- Inline create form (simplified) -->
        <div *ngIf="showCreateForm" style="margin-top: 20px; padding: 20px; border: 1px solid #ddd; border-radius: 4px;">
          <h3>Create New Return</h3>
          <mat-form-field class="full-width">
            <mat-label>Order ID</mat-label>
            <input matInput [(ngModel)]="newReturn.orderId" required>
          </mat-form-field>
          <mat-form-field class="full-width">
            <mat-label>Reason</mat-label>
            <textarea matInput [(ngModel)]="newReturn.reason" rows="3" required></textarea>
          </mat-form-field>
          <div style="margin-top: 10px;">
            <button mat-raised-button color="primary" (click)="createReturn()">Submit</button>
            <button mat-button (click)="showCreateForm = false" style="margin-left: 10px;">Cancel</button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
    mat-card-header {
      display: flex;
      align-items: center;
    }
    table {
      width: 100%;
    }
  `]
})
export class ReturnListComponent implements OnInit {
  returns: Return[] = [];
  displayedColumns: string[] = ['returnId', 'orderId', 'reason', 'status', 'refundAmount', 'createdAt', 'actions'];
  showCreateForm = false;
  newReturn = { orderId: '', reason: '' };

  constructor(
    private returnService: ReturnService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns() {
    this.returnService.getAllReturns().subscribe({
      next: (returns) => {
        this.returns = returns;
      },
      error: () => {
        this.snackBar.open('Error loading returns', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateDialog() {
    this.showCreateForm = true;
  }

  createReturn() {
    if (!this.newReturn.orderId || !this.newReturn.reason) {
      this.snackBar.open('Please fill all fields', 'Close', { duration: 3000 });
      return;
    }

    this.returnService.createReturn(this.newReturn.orderId, this.newReturn.reason).subscribe({
      next: () => {
        this.snackBar.open('Return created successfully', 'Close', { duration: 2000 });
        this.showCreateForm = false;
        this.newReturn = { orderId: '', reason: '' };
        this.loadReturns();
      },
      error: () => {
        this.snackBar.open('Error creating return', 'Close', { duration: 3000 });
      }
    });
  }

  updateStatus(id: number, status: string) {
    this.returnService.updateReturnStatus(id, status).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 2000 });
        this.loadReturns();
      },
      error: () => {
        this.snackBar.open('Error updating status', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
      case 'REFUNDED':
        return 'primary';
      case 'PENDING':
        return 'accent';
      case 'REJECTED':
      case 'CANCELLED':
        return 'warn';
      default:
        return '';
    }
  }
}
