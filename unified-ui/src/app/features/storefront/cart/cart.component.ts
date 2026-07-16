import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface CartItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
}

interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  get userId(): string {
    return this.authService.currentUser?.id || 'guest-user';
  }

  get cartItems(): CartItem[] {
    return this.cart?.items || [];
  }

  get totalPrice(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private loadCart(): void {
    this.http.get<Cart>(`/api/cart/${this.userId}`).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    this.http
      .put(`/api/cart/${this.userId}/items/${item.itemId}`, { quantity: newQty })
      .subscribe({
        next: () => {
          item.quantity = newQty;
        },
        error: () => {
          this.notificationService.show('Failed to update quantity.', 'error');
        },
      });
  }

  removeItem(item: CartItem): void {
    this.http.delete(`/api/cart/${this.userId}/items/${item.itemId}`).subscribe({
      next: () => {
        if (this.cart) {
          this.cart.items = this.cart.items.filter((i) => i.id !== item.id);
        }
        this.notificationService.show('Item removed from cart.', 'success');
      },
      error: () => {
        this.notificationService.show('Failed to remove item.', 'error');
      },
    });
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/storefront/products']);
  }
}
