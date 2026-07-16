import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { AccountRoutingModule } from './account-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ReturnRequestComponent } from './return-request/return-request.component';

@NgModule({
  declarations: [ProfileComponent, OrderHistoryComponent, ReturnRequestComponent],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, AccountRoutingModule],
})
export class AccountModule {}
