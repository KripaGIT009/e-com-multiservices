import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

@NgModule({
  declarations: [AdminDashboardComponent],
  imports: [CommonModule, SharedModule, AdminRoutingModule],
})
export class AdminModule {}
