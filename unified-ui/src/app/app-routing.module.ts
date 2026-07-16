import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
  { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },
  { path: 'forgot-password', redirectTo: '/auth/forgot-password', pathMatch: 'full' },
  {
    path: 'storefront',
    loadChildren: () => import('./features/storefront/storefront.module').then(m => m.StorefrontModule),
  },
  { path: 'home', redirectTo: '/storefront', pathMatch: 'full' },
  { path: 'products', redirectTo: '/storefront/products', pathMatch: 'full' },
  { path: 'cart', redirectTo: '/storefront/cart', pathMatch: 'full' },
  {
    path: 'checkout',
    loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'account',
    loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER', 'ADMIN'] },
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
  },
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
