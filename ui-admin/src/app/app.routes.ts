import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { ItemListComponent } from './components/item-list/item-list.component';
import { OrderListComponent } from './components/order-list/order-list.component';
import { CartComponent } from './components/cart/cart.component';
import { PaymentListComponent } from './components/payment-list/payment-list.component';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { ReturnListComponent } from './components/return-list/return-list.component';
import { ShipmentListComponent } from './components/shipment-list/shipment-list.component';
import { NotificationListComponent } from './components/notification-list/notification-list.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  // Publicly accessible routes (no login gate)
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users', component: UserListComponent },
  { path: 'items', component: ItemListComponent },
  { path: 'orders', component: OrderListComponent },
  { path: 'cart', component: CartComponent },
  { path: 'payments', component: PaymentListComponent },
  { path: 'inventory', component: InventoryListComponent },
  { path: 'returns', component: ReturnListComponent },
  { path: 'shipments', component: ShipmentListComponent },
  { path: 'notifications', component: NotificationListComponent },
  { path: '**', redirectTo: '/login' }
];
