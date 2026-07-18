import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';
import { TimeSeriesEntry } from '../../models';

/**
 * Revenue chart component displaying a CSS-based bar chart for revenue time-series data.
 * Includes a period selector (daily/weekly/monthly) that reloads chart data on change.
 * Requirements: 7.1, 7.2, 7.3
 */
@Component({
  selector: 'app-revenue-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-chart.component.html',
  styleUrls: ['./revenue-chart.component.scss'],
})
export class RevenueChartComponent implements OnInit {
  data: TimeSeriesEntry[] = [];
  selectedPeriod: 'daily' | 'weekly' | 'monthly' = 'monthly';
  isLoading = false;
  maxValue = 0;

  readonly periods: { label: string; value: 'daily' | 'weekly' | 'monthly' }[] = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  onPeriodChange(period: 'daily' | 'weekly' | 'monthly'): void {
    this.selectedPeriod = period;
    this.loadData();
  }

  getBarHeight(value: number): string {
    if (this.maxValue === 0) return '0%';
    return `${(value / this.maxValue) * 100}%`;
  }

  formatCurrency(value: number): string {
    if (value >= 100000) {
      return '₹' + (value / 100000).toFixed(1) + 'L';
    }
    if (value >= 1000) {
      return '₹' + (value / 1000).toFixed(1) + 'K';
    }
    return '₹' + value.toFixed(0);
  }

  formatYAxisLabel(value: number): string {
    return this.formatCurrency(value);
  }

  get yAxisLabels(): number[] {
    if (this.maxValue === 0) return [0];
    const step = this.maxValue / 4;
    return [this.maxValue, step * 3, step * 2, step, 0];
  }

  shouldShowXLabel(index: number): boolean {
    if (this.data.length <= 12) return true;
    const step = Math.ceil(this.data.length / 12);
    return index % step === 0;
  }

  private loadData(): void {
    this.isLoading = true;
    this.analyticsService.getRevenueTimeSeries(this.selectedPeriod).subscribe({
      next: (entries) => {
        this.data = entries;
        this.maxValue = entries.length > 0
          ? Math.max(...entries.map((e) => e.value))
          : 0;
        this.isLoading = false;
      },
      error: () => {
        this.data = [];
        this.maxValue = 0;
        this.isLoading = false;
      },
    });
  }
}
