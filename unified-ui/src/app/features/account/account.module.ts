import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { AccountRoutingModule } from './account-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { OrderHistoryComponent } from './order-history/order-history.component';
import { ReturnRequestComponent } from './return-request/return-request.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { RecentlyViewedComponent } from './recently-viewed/recently-viewed.component';

@NgModule({
  declarations: [
    ProfileComponent,
    OrderHistoryComponent,
    ReturnRequestComponent,
    WishlistComponent,
    RecentlyViewedComponent,
  ],
  imports: [CommonModule, ReactiveFormsModule, SharedModule, AccountRoutingModule],
})
export class AccountModule {}
