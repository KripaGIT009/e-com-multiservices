import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { SellerAuthComponent } from './auth/seller-auth.component';
import { SellerLayoutComponent } from './layout/seller-layout.component';
import { SellerOverviewComponent } from './overview/seller-overview.component';
import { SellerProductsComponent } from './products/seller-products.component';
import { SellerOrdersComponent } from './orders/seller-orders.component';
import { SellerDeliveryComponent } from './delivery/seller-delivery.component';
import { SellerAccountComponent } from './account/seller-account.component';

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
    // Everything behind the shell requires a seller session. Approval is checked
    // server-side too — hiding controls is not the security boundary.
    path: '',
    component: SellerLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['SELLER'] },
    children: [
      { path: 'dashboard', component: SellerOverviewComponent },
      { path: 'products', component: SellerProductsComponent },
      { path: 'orders', component: SellerOrdersComponent },
      { path: 'delivery', component: SellerDeliveryComponent },
      { path: 'account', component: SellerAccountComponent },
    ],
  },
];

@NgModule({
  declarations: [
    SellerAuthComponent,
    SellerLayoutComponent,
    SellerOverviewComponent,
    SellerProductsComponent,
    SellerOrdersComponent,
    SellerDeliveryComponent,
    SellerAccountComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class SellerModule {}
