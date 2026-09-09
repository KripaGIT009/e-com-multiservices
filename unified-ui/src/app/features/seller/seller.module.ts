import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { SellerAuthComponent } from './auth/seller-auth.component';
import { SellerDashboardComponent } from './dashboard/seller-dashboard.component';

/**
 * Seller portal.
 *
 * Sign-in and registration are public; everything behind them requires a SELLER
 * token. Approval is enforced server-side as well — the dashboard only hides the
 * publish controls, it does not rely on that for security.
 */
const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: SellerAuthComponent, data: { mode: 'login' } },
  { path: 'register', component: SellerAuthComponent, data: { mode: 'register' } },
  {
    path: 'dashboard',
    component: SellerDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SELLER'] },
  },
];

@NgModule({
  declarations: [SellerAuthComponent, SellerDashboardComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class SellerModule {}
