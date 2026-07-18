import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardSummary } from '../../models';

interface KpiCard {
  label: string;
  value: string;
  icon: string;
}

/**
 * Displays 4 KPI summary cards for the admin dashboard.
 * Shows loading skeleton placeholders while data is fetching.
 * Requirements: 6.1, 6.2, 6.3
 */
@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss'],
})
export class KpiCardsComponent {
  @Input() data: DashboardSummary | null | undefined;
  @Input() isLoading = false;

  get cards(): KpiCard[] {
    if (!this.data) {
      return [];
    }
    return [
      {
        label: 'Total Revenue',
        value: this.formatCurrency(this.data.totalRevenue),
        icon: '₹',
      },
      {
        label: 'Total Orders',
        value: this.formatNumber(this.data.totalOrders),
        icon: '🛒',
      },
      {
        label: 'Total Customers',
        value: this.formatNumber(this.data.totalUsers),
        icon: '👥',
      },
      {
        label: 'Total Products',
        value: this.formatNumber(this.data.totalProducts),
        icon: '📦',
      },
    ];
  }

  private formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-IN');
  }
}
