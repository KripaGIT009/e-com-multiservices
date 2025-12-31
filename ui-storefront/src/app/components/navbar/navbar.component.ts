import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { CartService } from '../../services/cart.service';
import { CompareService } from '../../services/compare.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule],
  template: `
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo -->
        <div class="navbar-brand">
          <a routerLink="/" class="logo">
            <mat-icon>shopping_bag</mat-icon>
            <span>MyIndianStore</span>
          </a>
        </div>

        <!-- Navigation Links -->
        <div class="navbar-menu">
          <a routerLink="/products" class="nav-link">
            <mat-icon>storefront</mat-icon>
            Products
          </a>
          <a routerLink="/checkout" class="nav-link">
            <mat-icon>payment</mat-icon>
            Checkout
          </a>
          <a routerLink="/orders" class="nav-link">
            <mat-icon>history</mat-icon>
            Orders
          </a>
        </div>

        <!-- Right Side Icons -->
        <div class="navbar-icons">
          <!-- Compare Button with Badge -->
          <button mat-icon-button [matMenuTriggerFor]="compareMenu" class="icon-button">
            <mat-icon [matBadge]="compareCount" matBadgeColor="warn">compare_arrows</mat-icon>
          </button>
          <mat-menu #compareMenu="matMenu">
            <div mat-menu-item class="menu-header">
              <span>Compare Products ({{ compareCount }}/4)</span>
            </div>
            <button mat-menu-item *ngIf="compareCount > 0" (click)="goToCompare()">
              <mat-icon>list</mat-icon>
              <span>View Compare</span>
            </button>
            <button mat-menu-item *ngIf="compareCount > 0" (click)="clearCompare()">
              <mat-icon>delete</mat-icon>
              <span>Clear All</span>
            </button>
            <span *ngIf="compareCount === 0" class="menu-empty">Add items to compare</span>
          </mat-menu>

          <!-- Cart Button with Badge -->
          <button mat-icon-button [matMenuTriggerFor]="cartMenu" class="icon-button">
            <mat-icon [matBadge]="cartCount" matBadgeColor="warn">shopping_cart</mat-icon>
          </button>
          <mat-menu #cartMenu="matMenu">
            <div mat-menu-item class="menu-header">
              <span>Cart Items</span>
            </div>
            <div *ngIf="cartCount > 0; else emptyCart" class="menu-items">
              <div mat-menu-item *ngFor="let item of cartItems" class="cart-menu-item">
                <span>{{ item.quantity }}x {{ item.name }}</span>
                <span class="item-price">₹{{ item.price }}</span>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="goToCart()">
                <mat-icon>shopping_bag</mat-icon>
                <span>View Cart</span>
              </button>
            </div>
            <ng-template #emptyCart>
              <span mat-menu-item class="menu-empty">Cart is empty</span>
            </ng-template>
          </mat-menu>

          <!-- Wishlist Button -->
          <button mat-icon-button class="icon-button">
            <mat-icon>favorite_border</mat-icon>
          </button>

          <!-- Account Menu -->
          <button mat-icon-button [matMenuTriggerFor]="accountMenu" class="icon-button">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #accountMenu="matMenu">
            <button mat-menu-item>
              <mat-icon>person</mat-icon>
              <span>My Account</span>
            </button>
            <button mat-menu-item routerLink="/orders">
              <mat-icon>history</mat-icon>
              <span>Order History</span>
            </button>
            <button mat-menu-item>
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item>
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="navbar-search">
        <input type="text" placeholder="Search products..." class="search-input">
        <button mat-icon-button class="search-button">
          <mat-icon>search</mat-icon>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: white;
      border-bottom: 1px solid #ddd;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
    }

    .navbar-brand {
      flex-shrink: 0;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #ff9900;
      font-weight: 700;
      font-size: 20px;
    }

    .logo mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .navbar-menu {
      display: flex;
      gap: 30px;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #232f3e;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .nav-link:hover {
      color: #ff9900;
    }

    .nav-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .navbar-icons {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .icon-button {
      color: #232f3e;
    }

    .icon-button:hover {
      color: #ff9900;
    }

    .navbar-search {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      padding: 10px 20px;
      gap: 10px;
    }

    .search-input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .search-input:focus {
      outline: none;
      border-color: #ff9900;
      box-shadow: 0 0 0 3px rgba(255, 153, 0, 0.1);
    }

    .search-button {
      color: #ff9900;
    }

    .menu-header {
      font-weight: 600;
      color: #232f3e;
      padding: 10px 16px;
    }

    .menu-empty {
      color: #999;
      font-size: 12px;
      padding: 10px 16px;
    }

    .menu-items {
      max-height: 300px;
      overflow-y: auto;
    }

    .cart-menu-item {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 8px 16px;
      font-size: 12px;
    }

    .item-price {
      color: #ff9900;
      font-weight: 600;
      text-align: right;
      min-width: 50px;
    }

    @media (max-width: 768px) {
      .navbar-menu {
        display: none;
      }

      .navbar-search {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  cartCount: number = 0;
  cartItems: any[] = [];
  compareCount: number = 0;

  constructor(
    private cartService: CartService,
    private compareService: CompareService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to cart updates
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.cartCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    });

    // Subscribe to compare updates
    this.compareService.compareItems$.subscribe(items => {
      this.compareCount = items.length;
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToCompare(): void {
    this.router.navigate(['/compare']);
  }

  clearCompare(): void {
    this.compareService.clearCompare();
  }
}
