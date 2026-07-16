import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutStepperComponent } from './checkout-stepper/checkout-stepper.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

@NgModule({
  declarations: [CheckoutStepperComponent, OrderConfirmationComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, CheckoutRoutingModule],
})
export class CheckoutModule {}
