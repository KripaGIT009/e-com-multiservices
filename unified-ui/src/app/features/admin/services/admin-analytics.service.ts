import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  DashboardSummary,
  TimeSeriesEntry,
  StatusCount,
  TopProduct,
  ActivityFeedEntry,
} from '../models';

/**
 * Service for fetching admin dashboard analytics data.
 * Calls /api/admin/dashboard/* endpoints through the BFF proxy.
 * Requirements: 6.1, 7.1, 8.1, 9.1, 10.1
 */
@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  private readonly baseUrl = '/api/admin/dashboard';

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  getRevenueTimeSeries(
    period: 'daily' | 'weekly' | 'monthly'
  ): Observable<TimeSeriesEntry[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<TimeSeriesEntry[]>(`${this.baseUrl}/revenue`, {
      params,
    });
  }

  getOrderStatusDistribution(): Observable<StatusCount[]> {
    return this.http.get<StatusCount[]>(
      `${this.baseUrl}/orders/status-distribution`
    );
  }

  getTopSellingProducts(): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.baseUrl}/products/top-selling`);
  }

  getActivityFeed(): Observable<ActivityFeedEntry[]> {
    return this.http.get<ActivityFeedEntry[]>(`${this.baseUrl}/activity-feed`);
  }
}
