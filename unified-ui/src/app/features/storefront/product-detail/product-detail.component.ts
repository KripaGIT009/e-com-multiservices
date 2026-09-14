import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sku?: string;
  sellerName?: string;
  /** Absent on older item-service responses; see `sellerLabel`. */
  fulfilmentModel?: 'FIRST_PARTY' | 'SELLER' | 'DROPSHIP' | null;
}

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private recentlyViewed: RecentlyViewedService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.http.get<Product>(`/api/items/${id}`).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
        this.recentlyViewed.record(product);
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Product not found.', 'error');
      },
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService
      .addItem(this.product.id, this.quantity)
      .subscribe({
        next: () => {
          this.notificationService.show(`${this.product!.name} added to cart!`, 'success');
        },
        error: () => {
          this.notificationService.show('Failed to add item to cart.', 'error');
        },
      });
  }

  /**
   * "Sold by / Ships from" line (commerce-architecture §3). The dropship partner is
   * never named to the customer. Null when there is nothing truthful to say.
   */
  get sellerLabel(): string | null {
    const p = this.product;
    if (!p) return null;
    switch (p.fulfilmentModel) {
      case 'FIRST_PARTY':
        return 'Sold and shipped by MyIndianStore';
      case 'SELLER':
        return p.sellerName ? `Sold by ${p.sellerName}` : null;
      case 'DROPSHIP':
        return 'Ships from our partner warehouse';
      default:
        return p.sellerName ? `Sold by ${p.sellerName}` : null;
    }
  }

  updateQuantity(value: number): void {
    this.quantity = Math.max(1, this.quantity + value);
  }

  goBack(): void {
    this.router.navigate(['/storefront/products']);
  }
}
