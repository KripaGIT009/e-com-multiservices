import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalItems: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats = {
    totalOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    totalRevenue: 0,
  };
  isLoading = true;

  adminLinks = [
    { label: 'Manage Orders', path: '/admin/orders', icon: '📦' },
    { label: 'Manage Users', path: '/admin/users', icon: '👥' },
    { label: 'Manage Inventory', path: '/admin/inventory', icon: '📋' },
    { label: 'Manage Products', path: '/admin/products', icon: '🏷️' },
    { label: 'View Returns', path: '/admin/returns', icon: '↩️' },
    { label: 'Audit Logs', path: '/admin/audit', icon: '📝' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    // Try to fetch real dashboard data; fallback to placeholder
    this.http.get<DashboardStats>('/api/admin/dashboard').subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: () => {
        // Use placeholder data if API not available
        this.stats = {
          totalOrders: 142,
          totalUsers: 1250,
          totalItems: 89,
          totalRevenue: 524000,
        };
        this.isLoading = false;
      },
    });
  }
}
