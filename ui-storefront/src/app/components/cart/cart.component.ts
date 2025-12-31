import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../services/cart.service';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="cart-container">
      <div class="cart-content">
        <!-- Cart Items -->
        <div class="cart-items-section">
          <h1>Shopping Cart</h1>
          
          <div *ngIf="cartItems.length === 0" class="empty-cart">
            <mat-icon>shopping_cart</mat-icon>
            <h2>Your cart is empty</h2>
            <p>Add items to get started</p>
            <button mat-raised-button color="primary" routerLink="/products">
              Shop Now
            </button>
          </div>

          <div *ngIf="cartItems.length > 0" class="items-list">
            <div class="cart-header">
              <span>Price</span>
            </div>
            
            <div *ngFor="let item of cartItems" class="cart-item">
              <div class="item-image">
                <img [src]="item.imageUrl || 'https://via.placeholder.com/150'" [alt]="item.name">
              </div>
              
              <div class="item-details">
                <h3>{{ item.name }}</h3>
                <p class="item-desc" *ngIf="item.description">{{ item.description }}</p>
                <div class="item-status in-stock">
                  <mat-icon>check_circle</mat-icon>
                  In Stock
                </div>
                
                <div class="item-actions">
                  <div class="quantity-selector">
                    <label>Qty:</label>
                    <select [(ngModel)]="item.quantity" (change)="updateQuantity(item)">
                      <option *ngFor="let num of [1,2,3,4,5,6,7,8,9,10]" [value]="num">{{ num }}</option>
                    </select>
                  </div>
                  <button mat-button class="action-btn" (click)="removeItem(item)">
                    Delete
                  </button>
                  <button mat-button class="action-btn" (click)="saveForLater(item)">
                    Save for later
                  </button>
                </div>
              </div>
              
              <div class="item-price">
                <span class="price">₹{{ item.price | number:'1.0-0' }}</span>
                <p class="original-price" *ngIf="item.originalPrice">
                  M.R.P.: <span class="strikethrough">₹{{ item.originalPrice | number:'1.0-0' }}</span>
                </p>
              </div>
            </div>
            
            <div class="cart-subtotal">
              <span>Subtotal ({{ getTotalItems() }} items):</span>
              <strong>₹{{ getSubtotal() | number:'1.0-0' }}</strong>
            </div>
          </div>
        </div>

        <!-- Cart Summary -->
        <div class="cart-summary" *ngIf="cartItems.length > 0">
          <mat-card>
            <div class="summary-content">
              <div class="free-delivery" *ngIf="getSubtotal() >= 499">
                <mat-icon>local_shipping</mat-icon>
                <p>Your order qualifies for FREE Delivery!</p>
              </div>
              
              <div class="summary-subtotal">
                <span>Subtotal ({{ getTotalItems() }} items):</span>
                <strong>₹{{ getSubtotal() | number:'1.0-0' }}</strong>
              </div>
              
              <button mat-raised-button class="checkout-btn" routerLink="/checkout">
                Proceed to Checkout
              </button>
            </div>
          </mat-card>
        </div>
      </div>
      
      <!-- Recommended Products -->
      <div class="recommendations" *ngIf="recommendedProducts.length > 0">
        <h2>Recommended for you</h2>
        <div class="products-scroll">
          <div *ngFor="let product of recommendedProducts" class="product-card">
            <img [src]="product.imageUrl || 'https://via.placeholder.com/150'" [alt]="product.name">
            <h4>{{ product.name }}</h4>
            <div class="product-rating">
              <mat-icon>star</mat-icon>
              <span>{{ product.rating || 4.2 }}</span>
            </div>
            <div class="product-price">
              <span class="price">₹{{ product.price | number:'1.0-0' }}</span>
            </div>
            <button mat-button class="add-btn" (click)="addToCart(product)">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cart-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      background: #f0f2f2;
      min-height: calc(100vh - 150px);
    }

    .cart-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      margin-bottom: 40px;
    }

    .cart-items-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
    }

    .cart-items-section h1 {
      font-size: 28px;
      font-weight: 400;
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid #ddd;
    }

    .empty-cart {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-cart mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ccc;
    }

    .empty-cart h2 {
      margin: 20px 0 10px;
      font-size: 24px;
      font-weight: 600;
    }

    .empty-cart p {
      color: #666;
      margin-bottom: 24px;
    }

    .cart-header {
      text-align: right;
      padding: 0 20px 12px 0;
      color: #565959;
      font-size: 14px;
      font-weight: 600;
    }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 180px 1fr auto;
      gap: 20px;
      padding: 20px 0;
      border-bottom: 1px solid #ddd;
    }

    .item-image {
      width: 180px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f8f8;
      border-radius: 4px;
    }

    .item-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-details h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: #007185;
      cursor: pointer;
    }

    .item-details h3:hover {
      color: #c7511f;
    }

    .item-desc {
      color: #565959;
      font-size: 13px;
      margin: 0;
    }

    .item-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
    }

    .item-status.in-stock {
      color: #007600;
    }

    .item-status mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .quantity-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #f0f2f2;
      border-radius: 8px;
    }

    .quantity-selector label {
      font-size: 13px;
      font-weight: 600;
    }

    .quantity-selector select {
      border: none;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    .action-btn {
      color: #007185 !important;
      font-size: 12px !important;
    }

    .action-btn:hover {
      color: #c7511f !important;
      text-decoration: underline;
    }

    .item-price {
      text-align: right;
      min-width: 120px;
    }

    .price {
      font-size: 24px;
      font-weight: 600;
      color: #111;
    }

    .original-price {
      font-size: 12px;
      color: #565959;
      margin: 4px 0 0 0;
    }

    .strikethrough {
      text-decoration: line-through;
    }

    .cart-subtotal {
      text-align: right;
      padding: 20px 20px 0 0;
      font-size: 18px;
    }

    .cart-subtotal strong {
      color: #111;
      font-size: 24px;
      margin-left: 8px;
    }

    .cart-summary mat-card {
      padding: 20px;
      position: sticky;
      top: 20px;
    }

    .free-delivery {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0f8ff;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      color: #007185;
    }

    .free-delivery mat-icon {
      color: #007185;
    }

    .free-delivery p {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
    }

    .summary-subtotal {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-size: 18px;
    }

    .summary-subtotal strong {
      font-size: 24px;
      color: #111;
    }

    .checkout-btn {
      width: 100%;
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b) !important;
      color: #111 !important;
      border: 1px solid #a88734 !important;
      height: 48px;
      font-size: 14px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
    }

    .checkout-btn:hover {
      background: linear-gradient(to bottom, #f5d78e, #edb932) !important;
    }

    .recommendations {
      background: white;
      padding: 20px;
      border-radius: 8px;
    }

    .recommendations h2 {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }

    .products-scroll {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .product-card {
      border: 1px solid #ddd;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .product-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .product-card img {
      width: 100%;
      height: 150px;
      object-fit: contain;
      margin-bottom: 12px;
    }

    .product-card h4 {
      font-size: 13px;
      font-weight: 400;
      margin: 0 0 8px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-rating {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .product-rating mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #ffa41c;
    }

    .product-rating span {
      font-size: 13px;
    }

    .product-price {
      margin-bottom: 8px;
    }

    .product-price .price {
      font-size: 18px;
      font-weight: 600;
    }

    .add-btn {
      width: 100%;
      background: #ffd814 !important;
      color: #111 !important;
      border-radius: 8px !important;
      font-size: 13px !important;
    }

    @media (max-width: 1024px) {
      .cart-content {
        grid-template-columns: 1fr;
      }

      .cart-summary {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .cart-item {
        grid-template-columns: 100px 1fr;
        gap: 12px;
      }

      .item-price {
        grid-column: 2;
        text-align: left;
        margin-top: 8px;
      }

      .item-image {
        width: 100px;
        height: 100px;
      }

      .products-scroll {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      }
    }
  `]
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  recommendedProducts: any[] = [];
  private isBrowser: boolean;

  constructor(
    private cartService: CartService,
    private itemService: ItemService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.loadCart();
    this.loadRecommendations();
    
    // Auto-refresh cart when items are added/removed
    this.cartService.onCartUpdated().subscribe(() => {
      this.loadCart();
    });
  }

  loadCart(): void {
    if (!this.isBrowser) return;

    const userId = localStorage.getItem('userId') || 'guest';
    this.cartService.getCart(userId).subscribe({
      next: (cart) => {
        this.cartItems = cart?.items || [];
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.cartItems = [];
      }
    });
  }

  loadRecommendations(): void {
    this.itemService.getAllItems().subscribe({
      next: (items) => {
        this.recommendedProducts = items.slice(0, 6).map(item => ({
          ...item,
          rating: (Math.random() * 2 + 3).toFixed(1),
          imageUrl: null
        }));
      },
      error: (error) => {
        console.error('Error loading recommendations:', error);
      }
    });
  }

  updateQuantity(item: any): void {
    if (!this.isBrowser) return;

    const userId = localStorage.getItem('userId') || 'guest';
    this.cartService.updateItemQuantity(userId, item.id, item.quantity).subscribe({
      next: () => {
        this.snackBar.open('Quantity updated', 'Close', { duration: 2000 });
        this.loadCart();
      },
      error: (error) => {
        console.error('Error updating quantity:', error);
        this.snackBar.open('Error updating quantity', 'Close', { duration: 3000 });
      }
    });
  }

  removeItem(item: any): void {
    if (!this.isBrowser) return;

    const userId = localStorage.getItem('userId') || 'guest';
    this.cartService.removeFromCart(userId, item.id).subscribe({
      next: () => {
        this.loadCart();
        this.snackBar.open('Item removed from cart', 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.snackBar.open('Error removing item', 'Close', { duration: 3000 });
      }
    });
  }

  saveForLater(item: any): void {
    this.snackBar.open('Saved for later!', 'Close', { duration: 2000 });
  }

  addToCart(product: any): void {
    if (!this.isBrowser) return;

    const userId = localStorage.getItem('userId') || 'guest';
    this.cartService.addToCart(userId, product.id, 1, product.name, product.price).subscribe({
      next: () => {
        this.snackBar.open('Added to cart!', 'Close', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.snackBar.open('Error adding to cart', 'Close', { duration: 3000 });
      }
    });
  }

  getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }
}
