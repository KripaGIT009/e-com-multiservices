import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sku?: string;
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
    private notificationService: NotificationService
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
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Product not found.', 'error');
      },
    });
  }

  addToCart(): void {
    if (!this.product) return;
    const userId = this.authService.currentUser?.id || 'guest-user';
    this.http
      .post(`/api/cart/${userId}/items`, { itemId: this.product.id, quantity: this.quantity })
      .subscribe({
        next: () => {
          this.notificationService.show(`${this.product!.name} added to cart!`, 'success');
        },
        error: () => {
          this.notificationService.show('Failed to add item to cart.', 'error');
        },
      });
  }

  updateQuantity(value: number): void {
    this.quantity = Math.max(1, this.quantity + value);
  }

  goBack(): void {
    this.router.navigate(['/storefront/products']);
  }
}
