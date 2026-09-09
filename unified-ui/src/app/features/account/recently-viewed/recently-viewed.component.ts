import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { RecentlyViewedService, ViewedProduct } from '../../../core/services/recently-viewed.service';
import { productPlaceholder } from '../../../core/utils/product-image';

@Component({
  selector: 'app-recently-viewed',
  templateUrl: './recently-viewed.component.html',
  styleUrls: ['./recently-viewed.component.scss'],
})
export class RecentlyViewedComponent implements OnInit {
  products: ViewedProduct[] = [];

  constructor(
    private recentlyViewed: RecentlyViewedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.products = this.recentlyViewed.list();
  }

  imageFor(p: ViewedProduct): string {
    return productPlaceholder(p.name, p.id);
  }

  view(p: ViewedProduct): void {
    this.router.navigate(['/storefront/products', p.id]);
  }

  remove(p: ViewedProduct, event: Event): void {
    event.stopPropagation();
    this.recentlyViewed.remove(p.id);
    this.products = this.recentlyViewed.list();
  }

  clearAll(): void {
    this.recentlyViewed.clear();
    this.products = [];
  }

  browse(): void {
    this.router.navigate(['/storefront/products']);
  }
}
