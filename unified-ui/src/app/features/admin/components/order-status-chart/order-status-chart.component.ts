import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';
import { StatusCount } from '../../models';

interface ChartSegment {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

/**
 * Displays a donut chart for order status distribution using CSS conic-gradient.
 * Requirements: 8.1, 8.2
 */
@Component({
  selector: 'app-order-status-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status-chart.component.html',
  styleUrls: ['./order-status-chart.component.scss'],
})
export class OrderStatusChartComponent implements OnInit {
  segments: ChartSegment[] = [];
  conicGradient = '';
  isLoading = true;
  isEmpty = false;
  totalOrders = 0;

  private readonly statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    CONFIRMED: '#3b82f6',
    SHIPPED: '#8b5cf6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
  };

  private readonly fallbackColors = [
    '#6366f1',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#64748b',
  ];

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.analyticsService.getOrderStatusDistribution().subscribe({
      next: (data) => {
        this.buildChart(data);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.isEmpty = true;
      },
    });
  }

  private buildChart(data: StatusCount[]): void {
    this.totalOrders = data.reduce((sum, item) => sum + item.count, 0);

    if (this.totalOrders === 0) {
      this.isEmpty = true;
      return;
    }

    let fallbackIndex = 0;
    this.segments = data
      .filter((item) => item.count > 0)
      .map((item) => {
        let color = this.statusColors[item.status.toUpperCase()];
        if (!color) {
          color = this.fallbackColors[fallbackIndex % this.fallbackColors.length];
          fallbackIndex++;
        }
        return {
          status: item.status,
          count: item.count,
          color,
          percentage: (item.count / this.totalOrders) * 100,
        };
      });

    this.conicGradient = this.buildConicGradient();
  }

  private buildConicGradient(): string {
    const stops: string[] = [];
    let currentAngle = 0;

    for (const segment of this.segments) {
      const startAngle = currentAngle;
      const endAngle = currentAngle + (segment.percentage / 100) * 360;
      stops.push(`${segment.color} ${startAngle}deg ${endAngle}deg`);
      currentAngle = endAngle;
    }

    return `conic-gradient(${stops.join(', ')})`;
  }
}
