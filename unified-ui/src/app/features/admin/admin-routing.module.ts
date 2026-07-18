import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

/**
 * Admin sub-page routes are protected by the parent-level route guards
 * defined in AppRoutingModule: [AuthGuard, RoleGuard] with data: { roles: ['ADMIN'] }.
 * All child routes below inherit this protection — only authenticated users
 * with the ADMIN role can access any /admin/* path.
 *
 * AdminLayoutComponent serves as the parent shell, providing the top bar,
 * collapsible sidebar, and a nested <router-outlet> for child pages.
 */
const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'dashboard', component: AdminDashboardComponent },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/product-management/product-management.component').then(
            (m) => m.ProductManagementComponent
          ),
      },
      {
        path: 'products/add',
        loadComponent: () =>
          import('./pages/add-product/add-product.component').then(
            (m) => m.AddProductComponent
          ),
      },
      {
        path: 'orders',
        redirectTo: 'orders/active',
        pathMatch: 'full',
      },
      {
        path: 'orders/active',
        loadComponent: () =>
          import('./pages/active-orders/active-orders.component').then(
            (m) => m.ActiveOrdersComponent
          ),
      },
      {
        path: 'orders/closed',
        loadComponent: () =>
          import('./pages/closed-orders/closed-orders.component').then(
            (m) => m.ClosedOrdersComponent
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./pages/order-details/order-details.component').then(
            (m) => m.OrderDetailsComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./pages/return-management/return-management.component').then(
            (m) => m.ReturnManagementComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then(
            (m) => m.CategoriesComponent
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/reviews/reviews.component').then(
            (m) => m.ReviewsComponent
          ),
      },
      {
        path: 'earnings',
        loadComponent: () =>
          import('./pages/earnings/earnings.component').then(
            (m) => m.EarningsComponent
          ),
      },
      {
        path: 'payouts',
        loadComponent: () =>
          import('./pages/payouts/payouts.component').then(
            (m) => m.PayoutsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/store-settings/store-settings.component').then(
            (m) => m.StoreSettingsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
