import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LowStockItem {
  productName: string;
  currentStock: number;
  threshold: number;
}

/**
 * Displays low stock alert items below the configured threshold.
 * Shows product name, current stock, and threshold with warning styling.
 * Requirements: 9.2, 9.3
 */
@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-stock-alerts.component.html',
  styleUrls: ['./low-stock-alerts.component.scss'],
})
export class LowStockAlertsComponent {
  /** Number of low stock items from the dashboard summary */
  @Input() lowStockCount = 0;

  /** Optional list of low stock items with details */
  @Input() items: LowStockItem[] = [];

  /** Loading state */
  @Input() isLoading = false;

  get hasAlerts(): boolean {
    return this.items.length > 0 || this.lowStockCount > 0;
  }

  get displayCount(): number {
    return this.items.length > 0 ? this.items.length : this.lowStockCount;
  }
}
