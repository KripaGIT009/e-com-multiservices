import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ShipmentService, Shipment } from '../../services/shipment.service';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Shipment Tracking</mat-card-title>
        <div style="margin-left: auto; display: flex; gap: 10px;">
          <mat-form-field style="width: 250px;">
            <mat-label>Track by Number</mat-label>
            <input matInput [(ngModel)]="trackingNumber" placeholder="Enter tracking number">
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="trackShipment()">
            <mat-icon>search</mat-icon> Track
          </button>
        </div>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="shipments" class="full-width">
          <ng-container matColumnDef="shipmentNumber">
            <th mat-header-cell *matHeaderCellDef>Shipment #</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.shipmentNumber}}</td>
          </ng-container>

          <ng-container matColumnDef="orderId">
            <th mat-header-cell *matHeaderCellDef>Order ID</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.orderId}}</td>
          </ng-container>

          <ng-container matColumnDef="trackingNumber">
            <th mat-header-cell *matHeaderCellDef>Tracking #</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.trackingNumber}}</td>
          </ng-container>

          <ng-container matColumnDef="carrier">
            <th mat-header-cell *matHeaderCellDef>Carrier</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.carrier || 'STANDARD'}}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let shipment">
              <mat-chip [color]="getStatusColor(shipment.status)" selected>
                {{shipment.status}}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="estimatedDelivery">
            <th mat-header-cell *matHeaderCellDef>Est. Delivery</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.estimatedDelivery | date: 'short'}}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let shipment">{{shipment.createdAt | date: 'short'}}</td>
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
    mat-card-header {
      display: flex;
      align-items: center;
    }
    table {
      width: 100%;
    }
  `]
})
export class ShipmentListComponent implements OnInit {
  shipments: Shipment[] = [];
  displayedColumns: string[] = ['shipmentNumber', 'orderId', 'trackingNumber', 'carrier', 'status', 'estimatedDelivery', 'createdAt'];
  trackingNumber = '';

  constructor(
    private shipmentService: ShipmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.shipmentService.getAllShipments().subscribe({
      next: (shipments) => {
        this.shipments = shipments;
      },
      error: () => {
        this.snackBar.open('Error loading shipments', 'Close', { duration: 3000 });
      }
    });
  }

  trackShipment() {
    if (!this.trackingNumber) {
      this.snackBar.open('Please enter tracking number', 'Close', { duration: 2000 });
      return;
    }

    this.shipmentService.trackShipment(this.trackingNumber).subscribe({
      next: (shipment) => {
        this.shipments = [shipment];
        this.snackBar.open('Shipment found', 'Close', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Shipment not found', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'primary';
      case 'IN_TRANSIT':
      case 'SHIPPED':
        return 'accent';
      case 'PENDING':
      case 'CREATED':
        return '';
      case 'EXCEPTION':
      case 'CANCELLED':
        return 'warn';
      default:
        return '';
    }
  }
}
