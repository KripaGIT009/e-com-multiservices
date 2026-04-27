import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { LogoComponent } from './components/logo/logo.component';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-location-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="location-dialog">
      <h2 mat-dialog-title>
        <mat-icon>location_on</mat-icon>
        Choose your location
      </h2>
      <mat-dialog-content>
        <p class="subtitle">Select a delivery location to see product availability</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>PIN Code</mat-label>
          <input matInput [(ngModel)]="pinCode" placeholder="110001" maxlength="6" />
          <mat-icon matSuffix>pin_drop</mat-icon>
        </mat-form-field>

        <div class="or-divider">OR</div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>City</mat-label>
          <input matInput [(ngModel)]="city" placeholder="New Delhi" />
          <mat-icon matSuffix>location_city</mat-icon>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions>
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" (click)="saveLocation()" [disabled]="!pinCode && !city">
          Apply
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .location-dialog {
      min-width: 400px;
    }
    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #131921;
    }
    .subtitle {
      color: #666;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .or-divider {
      text-align: center;
      margin: 16px 0;
      color: #666;
      font-size: 12px;
    }
    mat-dialog-actions {
      justify-content: flex-end;
      gap: 8px;
    }
  `]
})
export class LocationDialogComponent {
  pinCode: string = '';
  city: string = '';

  saveLocation(): void {
    console.log('Location saved');
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LogoComponent,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatSidenavModule,
    MatListModule,
    FormsModule
  ],
  template: `
    <!-- MYINDIANSTORE STYLE HEADER -->
    <header class="header">
      <!-- Top Navigation Bar -->
      <div class="nav-top">
        <div class="nav-left">
          <app-logo (click)="goHome()"></app-logo>
          <button mat-button class="location-btn" (click)="openLocationDialog()">
            <mat-icon>location_on</mat-icon>
            <div class="location-text">
              <span class="small">Deliver to</span>
              <span class="large">India</span>
            </div>
          </button>
        </div>

        <div class="search-box">
          <select class="category-select">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home</option>
          </select>
          <input type="text" placeholder="Search products..." [(ngModel)]="searchQuery" (keyup.enter)="search()">
          <button (click)="search()">
            <mat-icon>search</mat-icon>
          </button>
        </div>

        <div class="nav-right">
          <!-- Account & Lists — custom hover dropdown -->
          <div class="account-dropdown-wrapper" (mouseenter)="showAccountMenu=true" (mouseleave)="showAccountMenu=false">
            <button class="nav-link account-btn">
              <mat-icon>account_circle</mat-icon>
              <div class="nav-text">
                <span class="small">Hello, {{ isLoggedIn ? currentUsername : 'Sign in' }}</span>
                <span class="large">Account &amp; Lists <mat-icon class="caret">arrow_drop_down</mat-icon></span>
              </div>
            </button>

            <!-- Dropdown panel -->
            <div class="account-dropdown" [class.visible]="showAccountMenu">

              <!-- Guest state -->
              <ng-container *ngIf="!isLoggedIn">
                <div class="ad-top">
                  <button class="ad-signin-btn" routerLink="/login" (click)="showAccountMenu=false">Sign in</button>
                  <p class="ad-new">New customer? <a routerLink="/login" [queryParams]="{type:'signup'}" (click)="showAccountMenu=false">Start here.</a></p>
                </div>
                <div class="ad-divider"></div>
                <div class="ad-cols">
                  <div class="ad-col">
                    <div class="ad-col-title">Your Lists</div>
                    <a class="ad-link" routerLink="/wishlist" (click)="showAccountMenu=false">Create a Wish List</a>
                    <a class="ad-link" routerLink="/saved" (click)="showAccountMenu=false">Saved for Later</a>
                  </div>
                  <div class="ad-col">
                    <div class="ad-col-title">Your Account</div>
                    <a class="ad-link" routerLink="/login" (click)="showAccountMenu=false">Sign In</a>
                    <a class="ad-link" routerLink="/login" [queryParams]="{type:'signup'}" (click)="showAccountMenu=false">Create Account</a>
                  </div>
                </div>
              </ng-container>

              <!-- Logged-in state -->
              <ng-container *ngIf="isLoggedIn">
                <div class="ad-top logged">
                  <div class="ad-avatar">{{ getInitials() }}</div>
                  <div>
                    <div class="ad-hello">Hello, {{ currentUsername }}</div>
                    <div class="ad-role">{{ userRole }}</div>
                  </div>
                </div>
                <div class="ad-divider"></div>
                <div class="ad-cols">
                  <div class="ad-col">
                    <div class="ad-col-title">Your Account</div>
                    <a class="ad-link" (click)="goToProfile(); showAccountMenu=false">Account</a>
                    <a class="ad-link" (click)="goToOrders(); showAccountMenu=false">Orders</a>
                    <a class="ad-link" (click)="goToAddresses(); showAccountMenu=false">Addresses</a>
                    <a class="ad-link" (click)="goToPayments(); showAccountMenu=false">Payment Methods</a>
                    <a class="ad-link" (click)="goToSecurity(); showAccountMenu=false">Login & Security</a>
                  </div>
                  <div class="ad-col">
                    <div class="ad-col-title">Your Lists</div>
                    <a class="ad-link" (click)="goToWishlist(); showAccountMenu=false">Wish List</a>
                    <a class="ad-link" (click)="goToSavedItems(); showAccountMenu=false">Saved for Later</a>
                    <a class="ad-link" (click)="goToReminders(); showAccountMenu=false">Reminders</a>
                    <a class="ad-link" (click)="goToSubscriptions(); showAccountMenu=false">Subscriptions</a>
                  </div>
                </div>
                <div class="ad-divider"></div>
                <div class="ad-signout">
                  <a class="ad-link signout" (click)="logout(); showAccountMenu=false">Sign Out</a>
                </div>
              </ng-container>
            </div>
          </div>

          <!-- Cart button -->
          <button class="nav-link cart-btn" (click)="goToCart()">
            <div class="cart-wrap">
              <mat-icon class="cart-icon">shopping_cart</mat-icon>
              <span class="cart-count" [class.has-items]="cartCount > 0">{{ cartCount }}</span>
            </div>
            <span class="cart-label">Cart</span>
          </button>
        </div>
      </div>

      <!-- Menu Bar -->
      <div class="nav-menu">
        <button mat-button class="menu-btn" (click)="toggleSidebar()">
          <mat-icon>menu</mat-icon>All
        </button>

        <a mat-button class="menu-item" (click)="navigateToDeals('bestsellers')">Best Sellers</a>
        <a mat-button class="menu-item" (click)="navigateToDeals('new')">New Releases</a>
        <a mat-button class="menu-item" (click)="navigateToProducts('electronics')">Electronics</a>
        <a mat-button class="menu-item" (click)="navigateToProducts('fashion')">Fashion</a>
        <a mat-button class="menu-item" (click)="navigateToProducts('home')">Home</a>
        <a mat-button class="menu-item" (click)="navigateToProducts('books')">Books</a>
      </div>
    </header>

    <!-- OVERLAY BACKDROP -->
    <div class="sidebar-backdrop" [class.visible]="isSidebarOpen" (click)="closeSidebar()"></div>

    <!-- AMAZON-STYLE SLIDE-OVER SIDEBAR -->
    <div class="sidebar-drawer" [class.open]="isSidebarOpen">

      <!-- Header -->
      <div class="drawer-header">
        <mat-icon class="drawer-user-icon">account_circle</mat-icon>
        <span class="drawer-greeting">Hello, {{ isLoggedIn ? currentUsername : 'Guest' }}</span>
        <button class="drawer-close-btn" (click)="closeSidebar()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="drawer-body">

        <!-- Sign In CTA for guests -->
        <div class="drawer-signin" *ngIf="!isLoggedIn">
          <button class="drawer-signin-btn" routerLink="/login" (click)="closeSidebar()">
            Sign in
          </button>
          <span class="drawer-new-customer">
            New customer? <a routerLink="/login" [queryParams]="{type:'signup'}" (click)="closeSidebar()">Start here.</a>
          </span>
        </div>

        <!-- TRENDING -->
        <div class="drawer-section">
          <div class="drawer-section-title">Trending</div>
          <ul class="drawer-list">
            <li class="drawer-item" (click)="navigateToDeals('bestsellers')">
              <mat-icon class="di">trending_up</mat-icon><span>Best Sellers</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToDeals('new')">
              <mat-icon class="di">new_releases</mat-icon><span>New Releases</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToDeals('today')">
              <mat-icon class="di">local_offer</mat-icon><span>Today's Deals</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToDeals('lightning')">
              <mat-icon class="di">flash_on</mat-icon><span>Lightning Deals</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
          </ul>
        </div>

        <div class="drawer-divider"></div>

        <!-- SHOP BY CATEGORY -->
        <div class="drawer-section">
          <div class="drawer-section-title">Shop by Category</div>
          <ul class="drawer-list">
            <li class="drawer-item" (click)="navigateToProducts('all')">
              <mat-icon class="di">apps</mat-icon><span>All Products</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('electronics')">
              <mat-icon class="di">devices</mat-icon><span>Electronics</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('fashion')">
              <mat-icon class="di">checkroom</mat-icon><span>Fashion</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('home')">
              <mat-icon class="di">home</mat-icon><span>Home & Kitchen</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('sports')">
              <mat-icon class="di">sports_soccer</mat-icon><span>Sports & Outdoors</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('books')">
              <mat-icon class="di">menu_book</mat-icon><span>Books</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('toys')">
              <mat-icon class="di">toys</mat-icon><span>Toys & Games</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="navigateToProducts('beauty')">
              <mat-icon class="di">spa</mat-icon><span>Beauty & Health</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
          </ul>
        </div>

        <div class="drawer-divider"></div>

        <!-- YOUR ACCOUNT (logged in) -->
        <div class="drawer-section" *ngIf="isLoggedIn">
          <div class="drawer-section-title">Your Account</div>
          <ul class="drawer-list">
            <li class="drawer-item" (click)="goToProfile()">
              <mat-icon class="di">person</mat-icon><span>Your Profile</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="goToOrders()">
              <mat-icon class="di">receipt_long</mat-icon><span>Your Orders</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="goToWishlist()">
              <mat-icon class="di">favorite_border</mat-icon><span>Wish List</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="goToAddresses()">
              <mat-icon class="di">location_on</mat-icon><span>Your Addresses</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" (click)="goToPayments()">
              <mat-icon class="di">credit_card</mat-icon><span>Payment Methods</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
          </ul>
        </div>

        <div class="drawer-divider" *ngIf="isLoggedIn"></div>

        <!-- HELP & SETTINGS -->
        <div class="drawer-section">
          <div class="drawer-section-title">Help & Settings</div>
          <ul class="drawer-list">
            <li class="drawer-item" (click)="navigateToHelp()">
              <mat-icon class="di">headset_mic</mat-icon><span>Customer Service</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item" *ngIf="isLoggedIn" (click)="goToSecurity()">
              <mat-icon class="di">settings</mat-icon><span>Settings</span><mat-icon class="di-arrow">chevron_right</mat-icon>
            </li>
            <li class="drawer-item sign-out-item" *ngIf="isLoggedIn" (click)="logout()">
              <mat-icon class="di">logout</mat-icon><span>Sign Out</span>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <!-- MAIN CONTENT (no sidenav, full width always) -->
    <div class="main-content">
      <router-outlet></router-outlet>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-back-top">
        <button (click)="scrollToTop()">Back to top</button>
      </div>

      <div class="footer-content">
        <div class="footer-column">
          <h4>Get to Know Us</h4>
          <a href="#">About My Indian Store</a>
          <a href="#">Careers</a>
          <a href="#">Press Releases</a>
          <a href="#">Blog</a>
        </div>
        <div class="footer-column">
          <h4>Make Money with Us</h4>
          <a href="#">Sell on My Indian Store</a>
          <a href="#">Become an Affiliate</a>
          <a href="#">Advertise Products</a>
        </div>
        <div class="footer-column">
          <h4>My Indian Store Payment</h4>
          <a href="#">My Indian Store Rewards</a>
          <a href="#">Gift Cards</a>
          <a href="#">Credit Card</a>
        </div>
        <div class="footer-column">
          <h4>Let Us Help You</h4>
          <a href="#">Contact Us</a>
          <a href="#">Your Account</a>
          <a href="#">Returns</a>
          <a href="#">Help</a>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2025 My Indian Store. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
    }

    /* HEADER STYLES */
    .header {
      background: linear-gradient(to bottom, #131921 0%, #232f3e 100%);
      color: #fff;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    .nav-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      gap: 15px;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 20px;
      flex: 0.25;
    }

    app-logo {
      cursor: pointer;
    }

    .location-btn {
      color: #fff;
      padding: 8px;
    }

    .location-text {
      display: flex;
      flex-direction: column;
      font-size: 11px;
      text-align: left;
    }

    .location-text .small {
      color: #ccc;
      font-size: 10px;
    }

    .location-text .large {
      font-weight: 700;
      font-size: 13px;
    }

    .search-box {
      display: flex;
      flex: 1;
      gap: 0;
    }

    .category-select {
      padding: 8px 12px;
      border: none;
      border-radius: 4px 0 0 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .search-box input {
      flex: 1;
      border: none;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
    }

    .search-box button {
      background: #ff9900;
      border: none;
      padding: 8px 16px;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      color: #000;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 0.25;
      justify-content: flex-end;
    }

    .nav-link {
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      position: relative;
    }

    .nav-link.cart-button {
      position: relative;
    }

    .cart-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .cart-icon {
      position: relative;
      z-index: 1;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff5722;
      color: #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      border: 2px solid #fff;
    }

    .nav-link div {
      display: flex;
      flex-direction: column;
      font-size: 11px;
      text-align: left;
    }

    .nav-link .small {
      color: #ccc;
      font-size: 10px;
    }

    .nav-link .large {
      font-weight: 700;
      font-size: 13px;
    }

    /* MENU BAR */
    .nav-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 20px;
      height: 40px;
      background: #232f3e;
      border-top: 1px solid #444;
    }

    /* ── ACCOUNT & LISTS DROPDOWN ──────────────────────────────────────────── */
    .account-dropdown-wrapper {
      position: relative;
    }

    .account-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 3px;
      transition: outline 0.1s;
    }
    .account-btn:hover { outline: 1px solid #fff; }

    .nav-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .nav-text .small {
      font-size: 11px;
      color: #ccc;
      line-height: 1.2;
    }
    .nav-text .large {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .caret { font-size: 16px; width: 16px; height: 16px; }

    /* Dropdown panel */
    .account-dropdown {
      display: none;
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      width: 380px;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      z-index: 2000;
      color: #111;
    }
    .account-dropdown.visible { display: block; }

    /* Arrow pointer */
    .account-dropdown::before {
      content: '';
      position: absolute;
      top: -8px;
      right: 24px;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 8px solid #fff;
      filter: drop-shadow(0 -2px 2px rgba(0,0,0,0.1));
    }

    .ad-top {
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ad-top.logged { background: #f3f3f3; border-bottom: 1px solid #e0e0e0; }

    .ad-signin-btn {
      background: #ff9900;
      color: #111;
      border: none;
      border-radius: 3px;
      padding: 8px 20px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .ad-signin-btn:hover { background: #e68900; }

    .ad-new { font-size: 12px; color: #555; }
    .ad-new a { color: #0066c0; text-decoration: none; }
    .ad-new a:hover { text-decoration: underline; color: #c7511f; }

    .ad-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: #ff9900;
      color: #111;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
      flex-shrink: 0;
    }
    .ad-hello { font-size: 13px; font-weight: 700; }
    .ad-role { font-size: 11px; color: #666; text-transform: capitalize; }

    .ad-divider { height: 1px; background: #e7e7e7; }

    .ad-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      padding: 12px 0;
    }
    .ad-col { padding: 0 16px; }
    .ad-col + .ad-col { border-left: 1px solid #e7e7e7; }

    .ad-col-title {
      font-size: 12px;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e7e7e7;
    }

    .ad-link {
      display: block;
      font-size: 13px;
      color: #0066c0;
      text-decoration: none;
      padding: 3px 0;
      cursor: pointer;
      line-height: 1.5;
    }
    .ad-link:hover { color: #c7511f; text-decoration: underline; }
    .ad-link.signout { color: #c7511f; font-weight: 600; }

    .ad-signout { padding: 10px 16px; }

    /* ── CART BUTTON ─────────────────────────────────────────────────────────── */
    .cart-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #fff;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      padding: 6px 8px;
      border-radius: 3px;
      transition: outline 0.1s;
    }
    .cart-btn:hover { outline: 1px solid #fff; }

    .cart-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .cart-icon { font-size: 32px; width: 32px; height: 32px; }

    .cart-count {
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      font-weight: 700;
      color: #f08804;
      min-width: 18px;
      text-align: center;
      line-height: 1;
    }
    .cart-count.has-items { color: #f08804; }

    .cart-label {
      font-size: 13px;
      font-weight: 700;
      padding-bottom: 2px;
    }

    /* MENU BAR */
    .nav-menu {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 0 8px;
      height: 38px;
      background: #232f3e;
      border-top: 1px solid #3a4553;
    }

    .menu-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      padding: 0 12px;
      height: 100%;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      border-right: 1px solid #3a4553;
      transition: outline 0.1s;
    }
    .menu-btn:hover { outline: 1px solid #fff; border-radius: 2px; }

    .menu-item {
      background: none;
      border: none;
      color: #fff;
      font-size: 13px;
      padding: 0 12px;
      height: 100%;
      cursor: pointer;
      white-space: nowrap;
      transition: outline 0.1s;
    }
    .menu-item:hover { outline: 1px solid #fff; border-radius: 2px; }

    /* MAIN LAYOUT */
    .main-content {
      min-height: calc(100vh - 140px);
      background: #f5f5f5;
    }

    /* ── AMAZON-STYLE OVERLAY DRAWER ─────────────────────────────────────── */

    /* Dark backdrop */
    .sidebar-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.65);
      z-index: 1100;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .sidebar-backdrop.visible {
      display: block;
      opacity: 1;
    }

    /* Drawer panel */
    .sidebar-drawer {
      position: fixed;
      top: 0;
      left: 0;
      width: 320px;
      height: 100vh;
      background: #fff;
      z-index: 1200;
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 4px 0 20px rgba(0,0,0,0.3);
    }
    .sidebar-drawer.open {
      transform: translateX(0);
    }

    /* Drawer header — dark Amazon style */
    .drawer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px;
      background: #232f3e;
      color: #fff;
      flex-shrink: 0;
    }
    .drawer-user-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #ff9900;
    }
    .drawer-greeting {
      flex: 1;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
    }
    .drawer-close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .drawer-close-btn:hover {
      background: rgba(255,255,255,0.15);
    }
    .drawer-close-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    /* Scrollable body */
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
    .drawer-body::-webkit-scrollbar { width: 4px; }
    .drawer-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }

    /* Sign-in CTA */
    .drawer-signin {
      padding: 14px 16px;
      background: #f3f3f3;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .drawer-signin-btn {
      background: #ff9900;
      color: #111;
      border: none;
      border-radius: 4px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .drawer-signin-btn:hover { background: #e68900; }
    .drawer-new-customer {
      font-size: 12px;
      color: #555;
    }
    .drawer-new-customer a {
      color: #0066c0;
      text-decoration: none;
    }
    .drawer-new-customer a:hover { text-decoration: underline; }

    /* Section title */
    .drawer-section-title {
      padding: 12px 16px 6px;
      font-size: 13px;
      font-weight: 700;
      color: #111;
      background: #fff;
    }

    /* List */
    .drawer-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .drawer-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 13.5px;
      color: #111;
      cursor: pointer;
      transition: background 0.12s;
      border-bottom: 1px solid #f0f0f0;
    }
    .drawer-item:hover {
      background: #f0f2f2;
    }
    .drawer-item span {
      flex: 1;
    }
    .di {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #555;
      flex-shrink: 0;
    }
    .di-arrow {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #aaa;
      flex-shrink: 0;
    }
    .sign-out-item {
      color: #c7511f;
    }
    .sign-out-item .di { color: #c7511f; }

    /* Divider */
    .drawer-divider {
      height: 8px;
      background: #e7e7e7;
      border-top: 1px solid #d5d9d9;
      border-bottom: 1px solid #d5d9d9;
    }

    /* FOOTER */
    .footer {
      background: #131921;
      color: #fff;
      margin-top: 40px;
    }

    .footer-back-top {
      background: #232f3e;
      padding: 16px;
      text-align: center;
      border-bottom: 1px solid #444;
    }

    .footer-back-top button {
      background: none;
      border: none;
      color: #ff9900;
      cursor: pointer;
      font-weight: 600;
      padding: 8px 16px;
    }

    .footer-back-top button:hover {
      text-decoration: underline;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 32px;
      padding: 40px 24px;
    }

    .footer-column h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #fff;
    }

    .footer-column a {
      display: block;
      color: #ccc;
      text-decoration: none;
      font-size: 12px;
      margin-bottom: 8px;
      transition: color 0.2s;
    }

    .footer-column a:hover {
      color: #ff9900;
    }

    .footer-bottom {
      background: #0f1419;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #ccc;
      border-top: 1px solid #444;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .nav-top {
        flex-wrap: wrap;
      }

      .nav-left, .nav-right {
        flex: none;
        width: 100%;
      }

      .search-box {
        width: 100%;
        order: 3;
      }

      .sidebar-drawer {
        width: 280px;
      }

      .footer-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  cartCount = 0;
  searchQuery = '';
  isSidebarOpen = false;
  isLoggedIn = false;
  currentUsername = '';
  userRole = '';
  showAccountMenu = false;
  private cartSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateCartCount();
    this.checkLoginStatus();
    
    // Listen for storage changes to update badge when items are added from other components
    window.addEventListener('storage', () => this.updateCartCount());
    // Also listen for custom cart update events
    window.addEventListener('cartUpdated', () => {
      console.log('Cart updated event received');
      this.updateCartCount();
    });
    // Listen for login events
    window.addEventListener('userLoggedIn', (e: any) => {
      this.checkLoginStatus();
      this.updateCartCount();
    });
    // Listen for logout events
    window.addEventListener('userLoggedOut', () => {
      this.checkLoginStatus();
      this.updateCartCount();
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', () => this.updateCartCount());
    window.removeEventListener('cartUpdated', () => this.updateCartCount());
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  private updateCartCount(): void {
    try {
      const userId = localStorage.getItem('userId');
      let cart = [];
      
      // If user is logged in, get their cart; otherwise get guest cart
      if (userId && userId !== 'guest-user') {
        const cartData = localStorage.getItem('cart');
        cart = cartData ? JSON.parse(cartData) : [];
      } else {
        const guestCartData = localStorage.getItem('guestCart');
        cart = guestCartData ? JSON.parse(guestCartData) : [];
      }
      
      this.cartCount = Array.isArray(cart) ? cart.length : 0;
      console.log('Cart count updated:', this.cartCount, 'Cart data:', cart);
    } catch (error) {
      console.error('Error updating cart count:', error);
      this.cartCount = 0;
    }
  }

  openLocationDialog(): void {
    this.dialog.open(LocationDialogComponent, {
      width: '450px',
      disableClose: false
    });
  }

  search(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery } });
    }
  }

  goToCart(): void {
    this.router.navigate(['/checkout']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  private checkLoginStatus(): void {
    const user = localStorage.getItem('user');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    this.isLoggedIn = !!(user || username || userId);
    
    if (this.isLoggedIn) {
      if (user) {
        try {
          const userData = JSON.parse(user);
          this.currentUsername = userData.username || userData.email || 'User';
          this.userRole = userData.role || 'Customer';
        } catch (e) {
          this.currentUsername = username || userId || 'User';
          this.userRole = localStorage.getItem('userRole') || 'Customer';
        }
      } else {
        this.currentUsername = username || userId || 'User';
        this.userRole = localStorage.getItem('userRole') || 'Customer';
      }
    } else {
      this.currentUsername = '';
      this.userRole = '';
    }
  }

  getInitials(): string {
    if (!this.currentUsername) return 'U';
    const names = this.currentUsername.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.currentUsername.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.currentUsername = '';
    this.cartCount = 0;
    
    // Clear guest cart as well
    localStorage.removeItem('guestCart');
    localStorage.removeItem('cart');
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    // Redirect to home
    this.router.navigate(['/']);
  }

  // Navigation methods for menu items
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }

  goToSavedItems(): void {
    this.router.navigate(['/saved']);
  }

  goToReminders(): void {
    this.router.navigate(['/reminders']);
  }

  goToSubscriptions(): void {
    this.router.navigate(['/subscriptions']);
  }

  goToPayments(): void {
    this.router.navigate(['/payments']);
  }

  goToAddresses(): void {
    this.router.navigate(['/addresses']);
  }

  goToSecurity(): void {
    this.router.navigate(['/security']);
  }

  // Sidebar navigation methods
  navigateToProducts(category: string): void {
    this.closeSidebar();
    if (category === 'all') {
      this.router.navigate(['/products']);
    } else {
      this.router.navigate(['/products'], { queryParams: { category } });
    }
  }

  navigateToDeals(dealType: string): void {
    this.closeSidebar();
    this.router.navigate(['/products'], { queryParams: { deals: dealType } });
  }

  navigateToHelp(): void {
    this.closeSidebar();
    // For now, just show alert - can be replaced with actual help page
    alert('Customer Service: Contact us at support@myindianstore.com. Our team is available 24/7.');
  }
}
