import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';
import { TopProduct } from '../../models';

/**
 * Displays a ranked table of top 10 selling products.
 * Shows product name, quantity sold, and revenue formatted as ₹ currency.
 * Requirements: 9.1
 */
@Component({
  selector: 'app-top-products-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-products-table.component.html',
  styleUrls: ['./top-products-table.component.scss'],
})
export class TopProductsTableComponent implements OnInit {
  products: TopProduct[] = [];
  isLoading = true;
  isEmpty = false;

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.analyticsService.getTopSellingProducts().subscribe({
      next: (data) => {
        this.products = this.ensureSortOrder(data).slice(0, 10);
        this.isEmpty = this.products.length === 0;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.isEmpty = true;
      },
    });
  }

  /**
   * Verify sort order: products should be sorted descending by quantity sold.
   * The API returns them pre-sorted but we verify just in case.
   */
  private ensureSortOrder(products: TopProduct[]): TopProduct[] {
    return [...products].sort(
      (a, b) => b.totalQuantitySold - a.totalQuantitySold
    );
  }

  formatRevenue(value: number): string {
    return '₹' + value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatQuantity(value: number): string {
    return value.toLocaleString('en-IN');
  }
}
