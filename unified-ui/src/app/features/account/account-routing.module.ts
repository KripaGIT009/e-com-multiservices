import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ReturnRequestComponent } from './return-request/return-request.component';

const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: 'orders', component: OrderHistoryComponent },
  { path: 'returns', component: ReturnRequestComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
