import { Routes } from '@angular/router';
import { DashboardMyindianstoreComponent } from './components/dashboard/dashboard-myindianstore.component';
import { ProductsMyindianstoreComponent } from './components/products/products-myindianstore.component';
import { AuthMyindianstoreComponent } from './components/auth/auth-myindianstore.component';
import { CheckoutComponent } from './components/checkout/checkout.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardMyindianstoreComponent
  },
  {
    path: 'products',
    component: ProductsMyindianstoreComponent
  },
  {
    path: 'auth',
    component: AuthMyindianstoreComponent
  },
  {
    path: 'login',
    component: AuthMyindianstoreComponent
  },
  {
    path: 'signup',
    component: AuthMyindianstoreComponent
  },
  {
    path: 'checkout',
    component: CheckoutComponent
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent)
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./components/wishlist/wishlist.component').then(m => m.WishlistComponent)
  },
  {
    path: 'saved',
    loadComponent: () => import('./components/saved/saved.component').then(m => m.SavedComponent)
  },
  {
    path: 'reminders',
    loadComponent: () => import('./components/reminders/reminders.component').then(m => m.RemindersComponent)
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./components/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent)
  },
  {
    path: 'payments',
    loadComponent: () => import('./components/payments/payments.component').then(m => m.PaymentsComponent)
  },
  {
    path: 'addresses',
    loadComponent: () => import('./components/addresses/addresses.component').then(m => m.AddressesComponent)
  },
  {
    path: 'security',
    loadComponent: () => import('./components/security/security.component').then(m => m.SecurityComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
