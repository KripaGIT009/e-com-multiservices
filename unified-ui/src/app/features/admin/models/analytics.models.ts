/**
 * Analytics data models for the Admin Dashboard.
 * Requirements: 1.1, 2.4, 3.2, 4.2, 5.2
 */

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  totalUsers: number;
  newUsersThisWeek: number;
  totalProducts: number;
  lowStockCount: number;
  paymentSuccessRate: number;
  totalRefunds: number;
  warnings: string[];
}

export interface TimeSeriesEntry {
  label: string;
  value: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface ActivityFeedEntry {
  adminUsername: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}
