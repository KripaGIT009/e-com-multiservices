import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { DashboardSummary } from '../models';
import { StatusVariant } from '../components/status-badge/status-badge.component';

/**
 * Admin Dashboard page displaying KPI cards, quick actions,
 * order overview chart, and recent orders list.
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

interface RecentOrder {
  orderId: string;
  customerName: string;
  amount: number;
  status: string;
}

/** Shape returned by GET /api/orders for an administrator. */
interface AdminOrder {
  id: number;
  orderNumber?: string;
  customerId?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  dashboardSummary: DashboardSummary | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  userName = '';

  /** Recent orders for the bottom list section */
  recentOrders: RecentOrder[] = [];

  /** Quick actions for the dashboard */
  quickActions: QuickAction[] = [
    { label: 'Add Product', icon: 'add_box', route: '/admin/products/add' },
    { label: 'Manage Products', icon: 'inventory', route: '/admin/products' },
    { label: 'Active Orders', icon: 'pending_actions', route: '/admin/orders/active' },
    { label: 'Closed Orders', icon: 'check_circle', route: '/admin/orders/closed' },
    { label: 'Categories', icon: 'category', route: '/admin/categories' },
  ];

  constructor(
    private adminAnalyticsService: AdminAnalyticsService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.userName = user?.username || 'Admin';
    });
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.adminAnalyticsService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.dashboardSummary = summary;
        this.isLoading = false;

        this.loadRecentOrders();

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

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getStatusVariant(status: string): StatusVariant {
    const statusMap: Record<string, StatusVariant> = {
      pending: 'pending',
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    return statusMap[status.toLowerCase()] || 'default';
  }

  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  get totalOrders(): number {
    return this.dashboardSummary?.totalOrders || 0;
  }

  get activeOrders(): number {
    return this.dashboardSummary?.pendingOrders || 0;
  }

  get totalSales(): string {
    return this.formatCurrency(this.dashboardSummary?.totalRevenue || 0);
  }

  get totalProducts(): number {
    return this.dashboardSummary?.totalProducts || 0;
  }

  /**
   * Loads the five most recent real orders.
   *
   * This list used to be five hardcoded rows ("Rahul Sharma", "ORD-2024-001", …)
   * rendered directly beneath a KPI card counting the real orders they contradicted.
   */
  private loadRecentOrders(): void {
    this.http
      .get<AdminOrder[]>('/api/orders')
      .pipe(catchError(() => of([] as AdminOrder[])))
      .subscribe((orders) => {
        this.recentOrders = [...(orders || [])]
          .sort((a, b) => {
            const at = a.createdAt ? Date.parse(a.createdAt) : 0;
            const bt = b.createdAt ? Date.parse(b.createdAt) : 0;
            return bt - at || (b.id || 0) - (a.id || 0);
          })
          .slice(0, 5)
          .map((o) => ({
            orderId: o.orderNumber || `#${o.id}`,
            customerName: o.customerId ? `Customer ${o.customerId}` : 'Unknown',
            amount: o.totalAmount || 0,
            status: o.status || 'UNKNOWN',
          }));
      });
  }

  private showWarnings(warnings: string[]): void {
    this.notificationService.show(
      `Some data may be incomplete. ${warnings.join(', ')}`,
      'warning'
    );
  }
}
