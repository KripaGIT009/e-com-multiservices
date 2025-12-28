import { Routes } from '@angular/router';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { PaymentComponent } from './components/payment/payment.component';

export const routes: Routes = [
  {
    path: '',
    component: CheckoutComponent
  },
  {
    path: 'payment',
    component: PaymentComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
