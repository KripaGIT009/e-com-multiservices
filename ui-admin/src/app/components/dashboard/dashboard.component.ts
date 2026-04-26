import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { OpsService, OpsWorkQueueSummary } from '../../services/ops.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-dash">

      <!-- ── PAGE TITLE ──────────────────────────────────────── -->
      <div class="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p class="dash-sub">Welcome back, Admin &mdash; here's what's happening today</p>
        </div>
        <button class="refresh-btn" (click)="refresh()" title="Refresh">
          &#10227; Refresh
        </button>
      </div>

      <!-- ── KPI ROW ─────────────────────────────────────────── -->
      <div class="kpi-row" *ngIf="!kpiLoading">
        <div class="kpi-card" *ngFor="let k of kpiCards" (click)="navigateTo(k.route)">
          <div class="kpi-icon" [style.background]="k.color">{{ k.emoji }}</div>
          <div class="kpi-body">
            <div class="kpi-value">{{ k.value }}</div>
            <div class="kpi-label">{{ k.label }}</div>
            <div class="kpi-trend" [class.up]="k.trendUp" [class.down]="!k.trendUp">
              {{ k.trendUp ? '▲' : '▼' }} {{ k.trend }}
            </div>
          </div>
        </div>
      </div>
      <div class="kpi-loading" *ngIf="kpiLoading">
        <mat-spinner diameter="32"></mat-spinner>
        <span>Loading stats...</span>
      </div>

      <!-- ── WORK QUEUE ALERTS ───────────────────────────────── -->
      <div class="alerts-row" *ngIf="workQueueSummary">
        <div class="alert-item warn" *ngIf="workQueueSummary.pendingOrders > 0"
             (click)="navigateTo('/orders')">
          <span class="alert-icon">&#9888;</span>
          <span><strong>{{ workQueueSummary.pendingOrders }}</strong> orders pending action</span>
          <span class="alert-link">Review &rarr;</span>
        </div>
        <div class="alert-item info" *ngIf="workQueueSummary.readyToShipOrders > 0"
             (click)="navigateTo('/shipments')">
          <span class="alert-icon">&#128666;</span>
          <span><strong>{{ workQueueSummary.readyToShipOrders }}</strong> orders ready to ship</span>
          <span class="alert-link">Ship &rarr;</span>
        </div>
        <div class="alert-item danger" *ngIf="workQueueSummary.failedPayments > 0"
             (click)="navigateTo('/payments')">
          <span class="alert-icon">&#128683;</span>
          <span><strong>{{ workQueueSummary.failedPayments }}</strong> failed payments</span>
          <span class="alert-link">Fix &rarr;</span>
        </div>
        <div class="alert-item purple" *ngIf="workQueueSummary.pendingReturns > 0"
             (click)="navigateTo('/returns')">
          <span class="alert-icon">&#8617;</span>
          <span><strong>{{ workQueueSummary.pendingReturns }}</strong> returns pending</span>
          <span class="alert-link">Process &rarr;</span>
        </div>
      </div>

      <!-- ── QUICK ACCESS GRID ───────────────────────────────── -->
      <div class="section-title">Quick Access</div>
      <div class="quick-grid">
        <div class="quick-card" *ngFor="let card of dashboardCards" (click)="navigateTo(card.route)">
          <div class="quick-icon" [style.background]="card.color">{{ card.emoji }}</div>
          <div class="quick-body">
            <div class="quick-title">{{ card.title }}</div>
            <div class="quick-desc">{{ card.description }}</div>
          </div>
          <div class="quick-arrow">&#8250;</div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-dash {
      padding: 24px;
      background: #f0f2f2;
      min-height: 100%;
    }
    .dash-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .dash-header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #111;
      margin: 0 0 4px;
    }
    .dash-sub { font-size: 13px; color: #666; margin: 0; }
    .refresh-btn {
      background: #fff;
      border: 1px solid #d5d9d9;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      color: #333;
      transition: background 0.15s;
    }
    .refresh-btn:hover { background: #f7f7f7; }

    /* ── KPI ROW ──────────────────────────────────────────────── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 16px;
      color: #666;
    }
    .kpi-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      gap: 14px;
      align-items: center;
      cursor: pointer;
      border: 1px solid #e5e5e5;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #aaa; }
    .kpi-icon {
      width: 48px; height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .kpi-value { font-size: 1.6rem; font-weight: 700; color: #111; line-height: 1; }
    .kpi-label { font-size: 12px; color: #666; margin: 3px 0; }
    .kpi-trend { font-size: 11px; }
    .kpi-trend.up { color: #067d62; }
    .kpi-trend.down { color: #c00; }

    /* ── ALERTS ───────────────────────────────────────────────── */
    .alerts-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .alert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      flex: 1;
      min-width: 200px;
      border: 1px solid transparent;
      transition: filter 0.15s;
    }
    .alert-item:hover { filter: brightness(0.95); }
    .alert-item.warn { background: #fff3cd; border-color: #ffc107; color: #856404; }
    .alert-item.info { background: #d1ecf1; border-color: #0dcaf0; color: #0c5460; }
    .alert-item.danger { background: #f8d7da; border-color: #dc3545; color: #842029; }
    .alert-item.purple { background: #ede7f6; border-color: #9c27b0; color: #4a148c; }
    .alert-icon { font-size: 16px; }
    .alert-link { margin-left: auto; font-weight: 600; white-space: nowrap; }

    /* ── SECTION TITLE ────────────────────────────────────────── */
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #111;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ff9900;
      display: inline-block;
    }

    /* ── QUICK GRID ───────────────────────────────────────────── */
    .quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .quick-card {
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      cursor: pointer;
      border: 1px solid #e5e5e5;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .quick-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #bbb; }
    .quick-icon {
      width: 44px; height: 44px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .quick-body { flex: 1; }
    .quick-title { font-size: 14px; font-weight: 600; color: #111; }
    .quick-desc { font-size: 12px; color: #666; margin-top: 2px; }
    .quick-arrow { font-size: 22px; color: #aaa; }

    @media (max-width: 768px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .quick-grid { grid-template-columns: 1fr; }
      .alerts-row { flex-direction: column; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  workQueueSummary: OpsWorkQueueSummary | null = null;
  kpiLoading = true;

  kpiCards = [
    { label: 'Total Orders', value: '—', emoji: '🛒', color: '#e3f2fd', route: '/orders', trend: '+12% this week', trendUp: true },
    { label: 'Revenue', value: '—', emoji: '💸', color: '#e8f5e9', route: '/payments', trend: '+8% this month', trendUp: true },
    { label: 'Active Users', value: '—', emoji: '👤', color: '#fce4ec', route: '/users', trend: '+23 today', trendUp: true },
    { label: 'Pending Orders', value: '—', emoji: '⏳', color: '#fff8e1', route: '/orders', trend: 'Needs attention', trendUp: false },
    { label: 'Failed Payments', value: '—', emoji: '🚫', color: '#ffebee', route: '/payments', trend: 'Needs attention', trendUp: false },
    { label: 'Pending Returns', value: '—', emoji: '↩️', color: '#ede7f6', route: '/returns', trend: 'Needs attention', trendUp: false }
  ];

  dashboardCards = [
    { title: 'Users', description: 'Manage user accounts and permissions', emoji: '👤', route: '/users', color: '#e3f2fd' },
    { title: 'Products', description: 'Manage product catalog and pricing', emoji: '📦', route: '/items', color: '#fce4ec' },
    { title: 'Orders', description: 'View and process customer orders', emoji: '🛒', route: '/orders', color: '#e8f5e9' },
    { title: 'Carts', description: 'Monitor active shopping sessions', emoji: '🛍️', route: '/cart', color: '#e0f7fa' },
    { title: 'Payments', description: 'Track and manage transactions', emoji: '💳', route: '/payments', color: '#fff8e1' },
    { title: 'Inventory', description: 'Monitor stock levels and low-stock alerts', emoji: '🏭', route: '/inventory', color: '#ede7f6' },
    { title: 'Returns', description: 'Handle product returns and refunds', emoji: '↩️', route: '/returns', color: '#fbe9e7' },
    { title: 'Shipments', description: 'Track deliveries and logistics', emoji: '🚚', route: '/shipments', color: '#e8eaf6' },
    { title: 'Notifications', description: 'System alerts and messages', emoji: '🔔', route: '/notifications', color: '#f3e5f5' },
    { title: 'Workflow', description: 'Configure action priority recommendations', emoji: '⚙️', route: '/workflow-settings', color: '#e0f2f1' }
  ];

  constructor(
    private router: Router,
    private opsService: OpsService
  ) {}

  ngOnInit(): void {
    this.loadWorkQueueSummary();
  }

  refresh(): void {
    this.kpiLoading = true;
    this.loadWorkQueueSummary();
  }

  private loadWorkQueueSummary(): void {
    this.opsService.getWorkQueue().subscribe({
      next: (data) => {
        this.workQueueSummary = data?.summary ?? null;
        this.updateKpiCards();
        this.kpiLoading = false;
      },
      error: () => {
        this.workQueueSummary = null;
        this.kpiLoading = false;
        // Show placeholder values
        this.kpiCards[3].value = '?';
        this.kpiCards[4].value = '?';
        this.kpiCards[5].value = '?';
      }
    });
  }

  private updateKpiCards(): void {
    const s = this.workQueueSummary;
    if (!s) return;
    this.kpiCards[3].value = String(s.pendingOrders || 0);
    this.kpiCards[3].trendUp = s.pendingOrders === 0;
    this.kpiCards[4].value = String(s.failedPayments || 0);
    this.kpiCards[4].trendUp = s.failedPayments === 0;
    this.kpiCards[5].value = String(s.pendingReturns || 0);
    this.kpiCards[5].trendUp = s.pendingReturns === 0;
    // Simulated values for total orders/revenue/users (would come from order/user services)
    this.kpiCards[0].value = String(
      (s.pendingOrders || 0) + (s.readyToShipOrders || 0) + (s.paymentProcessingOrders || 0)
    );
    this.kpiCards[1].value = '₹—';
    this.kpiCards[2].value = '—';
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}