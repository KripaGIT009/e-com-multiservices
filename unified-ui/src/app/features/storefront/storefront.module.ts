import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { StorefrontRoutingModule } from './storefront-routing.module';
import { HomeComponent } from './home/home.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { CartComponent } from './cart/cart.component';

@NgModule({
  declarations: [
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    CartComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    StorefrontRoutingModule,
  ],
})
export class StorefrontModule {}
