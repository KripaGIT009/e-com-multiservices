import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService, InventoryItem } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="inv-page">
      <div class="page-header">
        <div>
          <h2>Inventory</h2>
          <p class="page-sub">{{ inventory.length }} items tracked</p>
        </div>
        <button class="refresh-btn" (click)="loadInventory()">&#x21bb; Refresh</button>
      </div>

      <div class="filter-bar">
        <input type="text" placeholder="Search by item name or ID..."
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()" />
        <div class="stock-chips">
          <button class="chip" [class.active]="stockFilter === 'all'" (click)="setFilter('all')">All</button>
          <button class="chip low" [class.active]="stockFilter === 'low'" (click)="setFilter('low')">Low Stock</button>
          <button class="chip out" [class.active]="stockFilter === 'out'" (click)="setFilter('out')">Out of Stock</button>
        </div>
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Loading inventory...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">&#x1F4E6;</div>
        <h3>No inventory items found</h3>
        <p>Try adjusting your search or filters</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && filtered.length > 0">
        <table class="inv-table">
          <thead>
            <tr>
              <th>Item ID</th>
              <th>Item Name</th>
              <th>Total Qty</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filtered">
              <td><span class="item-id">#{{ item.itemId }}</span></td>
              <td><strong>{{ item.itemName || ('Item ' + item.itemId) }}</strong></td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.reservedQuantity || 0 }}</td>
              <td><span class="qty-pill" [ngClass]="getQtyClass(item)">{{ getAvailable(item) }}</span></td>
              <td class="loc-col">{{ item.location || '—' }}</td>
              <td><span class="stock-badge" [ngClass]="getStockBadgeClass(item)">{{ getStockLabel(item) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .inv-page { padding: 24px; background: #f0f2f2; min-height: 100%; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 4px; }
    .page-sub { font-size: 12px; color: #666; margin: 0; }
    .refresh-btn { background: #fff; border: 1px solid #d5d9d9; padding: 9px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #333; font-weight: 600; }
    .refresh-btn:hover { background: #f7f7f7; }
    .filter-bar { background: #fff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .filter-bar input { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; width: 260px; outline: none; }
    .filter-bar input:focus { border-color: #ff9900; }
    .stock-chips { display: flex; gap: 6px; }
    .chip { border: 1px solid #d5d9d9; background: #fff; border-radius: 14px; padding: 4px 12px; font-size: 12px; cursor: pointer; font-weight: 600; color: #555; }
    .chip.active { background: #ff9900; border-color: #ff9900; color: #111; }
    .chip.low.active { background: #856404; border-color: #856404; color: #fff; }
    .chip.out.active { background: #721c24; border-color: #721c24; color: #fff; }
    .loading-wrap { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; background: #fff; border-radius: 8px; color: #666; font-size: 14px; }
    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #555; margin: 0 0 8px; }
    .empty-state p { color: #888; margin: 0; }
    .table-wrap { background: #fff; border-radius: 8px; border: 1px solid #e5e5e5; overflow-x: auto; }
    .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .inv-table thead tr { background: #f7f7f7; border-bottom: 2px solid #e5e5e5; }
    .inv-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .inv-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .inv-table tr:last-child td { border-bottom: none; }
    .inv-table tr:hover td { background: #fafafa; }
    .item-id { font-size: 11px; color: #888; }
    .loc-col { color: #777; font-size: 12px; }
    .qty-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 12px; }
    .qty-ok { background: #d4edda; color: #155724; }
    .qty-low { background: #fff3cd; color: #856404; }
    .qty-out { background: #f8d7da; color: #721c24; }
    .stock-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-ok { background: #d4edda; color: #155724; }
    .badge-low { background: #fff3cd; color: #856404; }
    .badge-out { background: #f8d7da; color: #721c24; }
  `]
})
export class InventoryListComponent implements OnInit {
  inventory: InventoryItem[] = [];
  filtered: InventoryItem[] = [];
  loading = false;
  searchQuery = '';
  stockFilter: 'all' | 'low' | 'out' = 'all';

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;
    this.inventoryService.getAllInventory().subscribe({
      next: (data) => {
        this.inventory = Array.isArray(data) ? data : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error loading inventory', 'Close', { duration: 3000 });
        this.inventory = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  setFilter(f: 'all' | 'low' | 'out'): void {
    this.stockFilter = f;
    this.applyFilter();
  }

  applyFilter(): void {
    let result = [...this.inventory];
    if (this.stockFilter === 'low') {
      result = result.filter(i => this.getAvailable(i) > 0 && this.getAvailable(i) < 10);
    } else if (this.stockFilter === 'out') {
      result = result.filter(i => this.getAvailable(i) <= 0);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(i =>
        (i.itemName || '').toLowerCase().includes(q) ||
        String(i.itemId).includes(q)
      );
    }
    this.filtered = result;
  }

  getAvailable(item: InventoryItem): number {
    return item.availableQuantity ?? (item.quantity - (item.reservedQuantity || 0));
  }

  getQtyClass(item: InventoryItem): string {
    const a = this.getAvailable(item);
    if (a <= 0) return 'qty-out';
    if (a < 10) return 'qty-low';
    return 'qty-ok';
  }

  getStockBadgeClass(item: InventoryItem): string {
    const a = this.getAvailable(item);
    if (a <= 0) return 'badge-out';
    if (a < 10) return 'badge-low';
    return 'badge-ok';
  }

  getStockLabel(item: InventoryItem): string {
    const a = this.getAvailable(item);
    if (a <= 0) return 'Out of Stock';
    if (a < 10) return 'Low Stock';
    return 'In Stock';
  }
}
