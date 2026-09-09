import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { SellerProduct } from '../seller.service';
import { NotificationService } from '../../../core/services/notification.service';

interface SellerStats {
  revenue: number;
  unitsSold: number;
  orderCount: number;
  openOrderCount: number;
  productCount: number;
  unitsInStock: number;
  stockValue: number;
  outOfStockCount: number;
  lowStock: SellerProduct[];
  revenueSeries: { date: string; value: number }[];
  topProducts: { productId: string; name: string; units: number; revenue: number }[];
}

@Component({
  selector: 'app-seller-overview',
  templateUrl: './seller-overview.component.html',
  styleUrls: ['./seller-overview.component.scss'],
})
export class SellerOverviewComponent implements OnInit {
  stats: SellerStats | null = null;
  isLoading = true;

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.http.get<SellerStats>('/api/seller/stats').subscribe({
      next: (s) => { this.stats = s; this.isLoading = false; },
      error: () => {
        this.isLoading = false;
        this.notify.show('Could not load your dashboard.', 'error');
      },
    });
  }

  /** Tallest bar in the series, used to scale the chart. Never zero. */
  get chartMax(): number {
    return Math.max(1, ...(this.stats?.revenueSeries || []).map((p) => p.value));
  }

  barHeight(value: number): number {
    return Math.round((value / this.chartMax) * 100);
  }

  /** Short label for the axis — only every third day, so it stays readable. */
  axisLabel(index: number, date: string): string {
    if (index % 3 !== 0) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : `${d.getDate()}/${d.getMonth() + 1}`;
  }

  get hasSales(): boolean {
    return (this.stats?.revenueSeries || []).some((p) => p.value > 0);
  }

  go(route: string): void {
    this.router.navigate([route]);
  }
}
