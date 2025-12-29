import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService, InventoryItem } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Inventory Management</mat-card-title>
        <button mat-raised-button color="primary" (click)="loadInventory()" style="margin-left: auto;">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="inventory" class="full-width">
          <ng-container matColumnDef="itemId">
            <th mat-header-cell *matHeaderCellDef>Item ID</th>
            <td mat-cell *matCellDef="let item">{{item.itemId}}</td>
          </ng-container>

          <ng-container matColumnDef="itemName">
            <th mat-header-cell *matHeaderCellDef>Item Name</th>
            <td mat-cell *matCellDef="let item">{{item.itemName || 'N/A'}}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Total Quantity</th>
            <td mat-cell *matCellDef="let item">{{item.quantity}}</td>
          </ng-container>

          <ng-container matColumnDef="reservedQuantity">
            <th mat-header-cell *matHeaderCellDef>Reserved</th>
            <td mat-cell *matCellDef="let item">{{item.reservedQuantity || 0}}</td>
          </ng-container>

          <ng-container matColumnDef="availableQuantity">
            <th mat-header-cell *matHeaderCellDef>Available</th>
            <td mat-cell *matCellDef="let item">
              <span [style.color]="getAvailabilityColor(item)">
                {{item.availableQuantity || item.quantity}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef>Location</th>
            <td mat-cell *matCellDef="let item">{{item.location || 'Warehouse A'}}</td>
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
export class InventoryListComponent implements OnInit {
  inventory: InventoryItem[] = [];
  displayedColumns: string[] = ['itemId', 'itemName', 'quantity', 'reservedQuantity', 'availableQuantity', 'location'];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.inventoryService.getAllInventory().subscribe({
      next: (inventory) => {
        this.inventory = inventory;
      },
      error: () => {
        this.snackBar.open('Error loading inventory', 'Close', { duration: 3000 });
      }
    });
  }

  getAvailabilityColor(item: InventoryItem): string {
    const available = item.availableQuantity || item.quantity;
    if (available <= 0) return 'red';
    if (available < 10) return 'orange';
    return 'green';
  }
}
