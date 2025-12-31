import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';
import { AuthComponent } from '../auth/auth.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatTableModule, 
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="products-container">
      <!-- Header Section -->
      <div class="products-header">
        <h1>Our Products</h1>
        <p class="subtitle">Discover amazing products at great prices</p>
      </div>
      
      <!-- Error Message -->
      <div *ngIf="error" class="error-banner">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error }}</span>
      </div>
      
      <!-- Loading Spinner -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading products...</p>
      </div>
      
      <!-- Products Grid -->
      <div *ngIf="!loading && items.length > 0" class="product-grid">
        <mat-card *ngFor="let item of items" class="product-card">
          <!-- Product Image Placeholder -->
          <div class="product-image">
            <mat-icon class="large-icon">inventory_2</mat-icon>
          </div>
          
          <mat-card-content>
            <h3 class="product-name">{{ item.name }}</h3>
            <p class="product-description">{{ item.description || 'Premium quality product' }}</p>
            <p class="product-type" *ngIf="item.itemType"><strong>Type:</strong> {{ item.itemType }}</p>
            
            <!-- Price and Stock -->
            <div class="product-info">
              <span class="price">\${{ item.price }}</span>
              <mat-chip 
                [class.in-stock]="item.stock > 0" 
                [class.out-of-stock]="item.stock === 0">
                <mat-icon>{{ item.stock > 0 ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ item.stock > 0 ? 'In Stock (' + item.stock + ')' : 'Out of Stock' }}
              </mat-chip>
            </div>
          </mat-card-content>
          
          <!-- Action Buttons -->
          <mat-card-actions>
            <button 
              mat-raised-button 
              color="primary" 
              [disabled]="item.stock === 0"
              (click)="addToCart(item)"
              class="add-to-cart-btn">
              <mat-icon>add_shopping_cart</mat-icon>
              Add to Cart
            </button>
            <button mat-button class="view-details-btn">
              <mat-icon>visibility</mat-icon>
              Details
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <!-- No Products -->
      <div *ngIf="!loading && items.length === 0" class="no-items">
        <mat-icon class="empty-icon">shopping_basket</mat-icon>
        <h2>No Products Available</h2>
        <p>Check back later for new arrivals!</p>
      </div>
    </div>
  `,
  styles: [`
    .products-container {
      min-height: calc(100vh - 64px);
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 2rem;
    }
    
    .products-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeIn 0.6s ease-in;
    }
    
    .products-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }
    
    .subtitle {
      font-size: 1.125rem;
      color: #666;
    }
    
    .error-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      animation: slideDown 0.4s ease-out;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      animation: fadeIn 0.6s ease-in;
    }
    
    .product-card {
      display: flex;
      flex-direction: column;
      border-radius: 16px !important;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      background: white;
    }
    
    .product-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }
    
    .product-image {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    .product-image::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      bottom: -50%;
      left: -50%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transform: rotate(45deg);
    }
    
    .large-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    mat-card-content {
      padding: 1.5rem !important;
      flex: 1;
    }
    
    .product-name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      color: #333;
    }
    
    .product-description {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      line-height: 1.5;
    }

    .product-type {
      font-size: 0.9rem;
      color: #555;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f0f4ff;
      border-left: 3px solid #667eea;
      border-radius: 4px;
    }

    .product-type strong {
      color: #667eea;
    }
    
    .product-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
    }
    
    .price {
      font-size: 1.75rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    mat-chip {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem !important;
      height: auto !important;
      display: flex !important;
      align-items: center;
      gap: 0.25rem;
    }
    
    mat-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    
    .in-stock {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
      color: white !important;
    }
    
    .out-of-stock {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%) !important;
      color: white !important;
    }
    
    mat-card-actions {
      padding: 0 1.5rem 1.5rem !important;
      display: flex;
      gap: 0.5rem;
    }
    
    .add-to-cart-btn {
      flex: 1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border-radius: 8px !important;
      padding: 0.75rem 1rem !important;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .add-to-cart-btn:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .add-to-cart-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .view-details-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #667eea;
    }
    
    .no-items {
      text-align: center;
      padding: 4rem;
      animation: fadeIn 0.6s ease-in;
    }
    
    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ccc;
      margin-bottom: 1rem;
    }
    
    .no-items h2 {
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .no-items p {
      color: #999;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 768px) {
      .product-grid {
        grid-template-columns: 1fr;
      }
      
      .products-header h1 {
        font-size: 2rem;
      }
    }
  `]
})
export class ProductsComponent implements OnInit {
  items: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private itemService: ItemService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load items:', err);
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
      }
    });
  }

  addToCart(item: any): void {
    const userId = localStorage.getItem('userId') || 'guest-user';
    
    this.cartService.addToCart(userId, item.id, 1).subscribe({
      next: () => {
        // Store guest cart item for migration after login
        if (userId === 'guest-user') {
          const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
          const existingItem = guestCart.find((cartItem: any) => cartItem.itemId === item.id);
          if (existingItem) {
            existingItem.quantity += 1;
          } else {
            guestCart.push({ itemId: item.id, quantity: 1, addedAt: new Date().toISOString() });
          }
          localStorage.setItem('guestCart', JSON.stringify(guestCart));
          
          // Trigger custom event to update cart count
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          
          // Show login prompt
          const snackBarRef = this.snackBar.open(
            `🎉 ${item.name} added! Please sign in to proceed with checkout and payment.`,
            'Sign In Now',
            {
              duration: 8000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['cart-snackbar']
            }
          );
          
          snackBarRef.onAction().subscribe(() => {
            this.openLoginDialog();
          });
        } else {
          this.snackBar.open(`${item.name} added to cart!`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (err) => {
        console.error('Failed to add to cart:', err);
        this.snackBar.open('Failed to add item to cart. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  openLoginDialog(): void {
    const dialogRef = this.dialog.open(AuthComponent, {
      width: '400px',
      disableClose: false
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        // User logged in successfully, migrate guest cart
        this.migrateGuestCart(result.userId);
      }
    });
  }
  
  migrateGuestCart(userId: string): void {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    
    if (guestCart.length > 0) {
      // Add all guest cart items to user's cart
      guestCart.forEach((cartItem: any) => {
        this.cartService.addToCart(userId, cartItem.itemId, cartItem.quantity).subscribe();
      });
      
      // Clear guest cart
      localStorage.removeItem('guestCart');
      
      this.snackBar.open('Your cart items have been saved!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar']
      });
    }
  }
}
