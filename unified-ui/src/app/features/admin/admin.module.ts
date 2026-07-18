import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';
import { OrderStatusChartComponent } from './components/order-status-chart/order-status-chart.component';
import { TopProductsTableComponent } from './components/top-products-table/top-products-table.component';
import { LowStockAlertsComponent } from './components/low-stock-alerts/low-stock-alerts.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';

@NgModule({
  declarations: [AdminDashboardComponent],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    KpiCardsComponent,
    QuickActionsComponent,
    RevenueChartComponent,
    OrderStatusChartComponent,
    TopProductsTableComponent,
    LowStockAlertsComponent,
    ActivityFeedComponent,
  ],
})
export class AdminModule {}
