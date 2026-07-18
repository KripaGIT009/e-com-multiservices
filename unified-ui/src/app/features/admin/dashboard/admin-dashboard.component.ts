import { Component, OnInit } from '@angular/core';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { DashboardSummary } from '../models';

/**
 * Orchestrates the admin dashboard layout by fetching analytics data
 * and passing it to sub-components (KPI cards, quick actions, placeholders).
 * Requirements: 6.1, 15.1
 */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  dashboardSummary: DashboardSummary | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(private adminAnalyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.adminAnalyticsService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.dashboardSummary = summary;
        this.isLoading = false;

        if (summary.warnings && summary.warnings.length > 0) {
          this.showWarnings(summary.warnings);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          'Failed to load dashboard data. Please try again.';
        console.error('Dashboard load error:', err);
      },
    });
  }

  retry(): void {
    this.loadDashboardData();
  }

  private showWarnings(warnings: string[]): void {
    // Display warning alert for services with degraded data
    const message = `Warning: Some data may be incomplete. ${warnings.join(', ')}`;
    alert(message);
  }
}
