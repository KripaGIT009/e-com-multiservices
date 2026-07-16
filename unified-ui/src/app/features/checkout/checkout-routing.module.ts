import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutStepperComponent } from './checkout-stepper/checkout-stepper.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

const routes: Routes = [
  { path: '', component: CheckoutStepperComponent },
  { path: 'confirmation', component: OrderConfirmationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutRoutingModule {}
