import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';

/**
 * Admin sub-page routes are protected by the parent-level route guards
 * defined in AppRoutingModule: [AuthGuard, RoleGuard] with data: { roles: ['ADMIN'] }.
 * All child routes below inherit this protection — only authenticated users
 * with the ADMIN role can access any /admin/* path.
 */
const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  {
    path: 'orders',
    loadComponent: () => import('./pages/order-management/order-management.component').then(m => m.OrderManagementComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/product-management/product-management.component').then(m => m.ProductManagementComponent)
  },
  {
    path: 'returns',
    loadComponent: () => import('./pages/return-management/return-management.component').then(m => m.ReturnManagementComponent)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
