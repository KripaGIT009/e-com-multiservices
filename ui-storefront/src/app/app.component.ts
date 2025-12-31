import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMyindianstoreComponent } from './app-myindianstore.component';

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
          <button mat-button class="nav-link" [matMenuTriggerFor]="accountMenu">
            <mat-icon>account_circle</mat-icon>
            <div>
              <span class="small">Hello, {{ isLoggedIn ? currentUsername : 'Guest' }}</span>
              <span class="large">Account & Lists</span>
            </div>
          </button>

          <mat-menu #accountMenu="matMenu" xPosition="after" yPosition="below" class="account-menu-panel">
            <!-- Guest User Menu -->
            <div class="account-menu" *ngIf="!isLoggedIn">
              <div class="guest-menu-header">
                <mat-icon class="guest-icon">person_outline</mat-icon>
                <div>
                  <div class="greeting">Welcome to My Indian Store</div>
                  <div class="sub">Sign in for the best experience</div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="guest-actions">
                <button mat-raised-button color="primary" class="sign-in-btn" routerLink="/login">
                  <mat-icon>login</mat-icon>
                  Sign In
                </button>
                <button mat-stroked-button class="sign-up-btn" routerLink="/login" [queryParams]="{type: 'signup'}">
                  <mat-icon>person_add</mat-icon>
                  Create Account
                </button>
              </div>
              <mat-divider></mat-divider>
              <div class="guest-links">
                <button mat-menu-item routerLink="/products">
                  <mat-icon>shopping_bag</mat-icon>
                  <span>Browse Products</span>
                </button>
                <button mat-menu-item (click)="goToCart()">
                  <mat-icon>shopping_cart</mat-icon>
                  <span>View Cart</span>
                </button>
              </div>
            </div>

            <!-- Logged In User Menu -->
            <div class="account-menu" *ngIf="isLoggedIn">
              <div class="account-menu-header">
                <div class="avatar">{{ getInitials() }}</div>
                <div>
                  <div class="greeting">Hello, {{ currentUsername }}</div>
                  <div class="sub">Manage your account and preferences</div>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="account-menu-columns">
                <div class="account-col">
                  <h4>Your Lists</h4>
                  <button mat-menu-item (click)="goToWishlist()">
                    <mat-icon>favorite</mat-icon>
                    Wishlist
                  </button>
                  <button mat-menu-item (click)="goToSavedItems()">
                    <mat-icon>bookmark</mat-icon>
                    Saved for Later
                  </button>
                  <button mat-menu-item (click)="goToReminders()">
                    <mat-icon>notifications</mat-icon>
                    Reminders
                  </button>
                </div>
                <div class="account-col">
                  <h4>Your Account</h4>
                  <button mat-menu-item (click)="goToProfile()">
                    <mat-icon>person</mat-icon>
                    Your Profile
                  </button>
                  <button mat-menu-item (click)="goToOrders()">
                    <mat-icon>receipt_long</mat-icon>
                    Orders
                  </button>
                  <button mat-menu-item (click)="goToSubscriptions()">
                    <mat-icon>subscriptions</mat-icon>
                    Subscriptions
                  </button>
                  <button mat-menu-item (click)="goToPayments()">
                    <mat-icon>payment</mat-icon>
                    Payments
                  </button>
                </div>
                <div class="account-col">
                  <h4>Settings</h4>
                  <button mat-menu-item (click)="goToAddresses()">
                    <mat-icon>location_on</mat-icon>
                    Addresses
                  </button>
                  <button mat-menu-item (click)="goToSecurity()">
                    <mat-icon>security</mat-icon>
                    Security
                  </button>
                  <button mat-menu-item (click)="logout()">
                    <mat-icon>logout</mat-icon>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </mat-menu>

          <button mat-button class="nav-link cart-button" (click)="goToCart()">
            <div class="cart-icon-wrapper">
              <mat-icon class="cart-icon">shopping_cart</mat-icon>
              <span class="cart-badge" *ngIf="cartCount > 0">{{ cartCount }}</span>
            </div>
            <div>
              <span class="small">Your</span>
              <span class="large">Cart</span>
            </div>
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

    <!-- MAIN LAYOUT WITH SIDEBAR -->
    <div class="main-wrapper">
      <mat-sidenav-container>
        <!-- SIDEBAR -->
        <mat-sidenav mode="side" [opened]="isSidebarOpen" class="sidebar">
          <div class="sidebar-header">
            <div class="sidebar-user-info">
              <mat-icon class="user-icon">{{ isLoggedIn ? 'account_circle' : 'person_outline' }}</mat-icon>
              <span class="sidebar-greeting">Hello, {{ isLoggedIn ? currentUsername : 'Guest' }}</span>
            </div>
            <button mat-icon-button class="sidebar-close" (click)="closeSidebar()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          
          <mat-nav-list>
            <!-- Sign In Prompt for Guests -->
            <div class="sidebar-section" *ngIf="!isLoggedIn">
              <button mat-raised-button color="primary" class="sidebar-signin-btn" routerLink="/login" (click)="closeSidebar()">
                <mat-icon>login</mat-icon>
                Sign In to Your Account
              </button>
            </div>

            <mat-divider *ngIf="!isLoggedIn"></mat-divider>

            <div class="sidebar-section">
              <h3>SHOP BY CATEGORY</h3>
              <mat-list-item routerLink="/products" routerLinkActive="active" (click)="navigateToProducts('all')">
                <mat-icon matListItemIcon>category</mat-icon>
                <span matListItemTitle>All Products</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToProducts('electronics')">
                <mat-icon matListItemIcon>devices</mat-icon>
                <span matListItemTitle>Electronics</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToProducts('fashion')">
                <mat-icon matListItemIcon>shopping_bag</mat-icon>
                <span matListItemTitle>Fashion</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToProducts('home')">
                <mat-icon matListItemIcon>home</mat-icon>
                <span matListItemTitle>Home & Kitchen</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToProducts('sports')">
                <mat-icon matListItemIcon>sports_soccer</mat-icon>
                <span matListItemTitle>Sports</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToProducts('books')">
                <mat-icon matListItemIcon>menu_book</mat-icon>
                <span matListItemTitle>Books</span>
              </mat-list-item>
            </div>

            <mat-divider></mat-divider>

            <div class="sidebar-section">
              <h3>DEALS & OFFERS</h3>
              <mat-list-item (click)="navigateToDeals('today')">
                <mat-icon matListItemIcon>local_offer</mat-icon>
                <span matListItemTitle>Today's Deals</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToDeals('lightning')">
                <mat-icon matListItemIcon>flash_on</mat-icon>
                <span matListItemTitle>Lightning Deals</span>
              </mat-list-item>
              <mat-list-item (click)="navigateToDeals('bestsellers')">
                <mat-icon matListItemIcon>trending_up</mat-icon>
                <span matListItemTitle>Bestsellers</span>
              </mat-list-item>
            </div>

            <mat-divider></mat-divider>

            <!-- Account Section - Only for Logged In Users -->
            <div class="sidebar-section" *ngIf="isLoggedIn">
              <h3>YOUR ACCOUNT</h3>
              <mat-list-item (click)="goToOrders()">
                <mat-icon matListItemIcon>receipt_long</mat-icon>
                <span matListItemTitle>Your Orders</span>
              </mat-list-item>
              <mat-list-item (click)="goToWishlist()">
                <mat-icon matListItemIcon>favorite</mat-icon>
                <span matListItemTitle>Wishlist</span>
              </mat-list-item>
              <mat-list-item (click)="goToProfile()">
                <mat-icon matListItemIcon>person</mat-icon>
                <span matListItemTitle>Your Profile</span>
              </mat-list-item>
              <mat-list-item (click)="goToAddresses()">
                <mat-icon matListItemIcon>location_on</mat-icon>
                <span matListItemTitle>Addresses</span>
              </mat-list-item>
              <mat-list-item (click)="goToPayments()">
                <mat-icon matListItemIcon>payment</mat-icon>
                <span matListItemTitle>Payment Methods</span>
              </mat-list-item>
            </div>

            <mat-divider *ngIf="isLoggedIn"></mat-divider>

            <!-- Help & Settings -->
            <div class="sidebar-section">
              <h3>HELP & SETTINGS</h3>
              <mat-list-item (click)="navigateToHelp()">
                <mat-icon matListItemIcon>help</mat-icon>
                <span matListItemTitle>Customer Service</span>
              </mat-list-item>
              <mat-list-item *ngIf="isLoggedIn" (click)="goToSecurity()">
                <mat-icon matListItemIcon>security</mat-icon>
                <span matListItemTitle>Settings</span>
              </mat-list-item>
              <mat-list-item *ngIf="isLoggedIn" (click)="logout()">
                <mat-icon matListItemIcon>logout</mat-icon>
                <span matListItemTitle>Sign Out</span>
              </mat-list-item>
            </div>
          </mat-nav-list>
        </mat-sidenav>

        <!-- CONTENT AREA -->
        <mat-sidenav-content class="content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
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

    /* ACCOUNT MENU PANEL */
    .account-menu-panel .mat-mdc-menu-content {
      padding: 0;
      min-width: 520px;
      background: transparent;
      box-shadow: 0 12px 30px rgba(0,0,0,0.25);
      border-radius: 10px;
    }

    .account-menu {
      padding: 16px 0 12px;
      color: #111;
      background: linear-gradient(135deg, #f7fbff 0%, #eef3ff 60%, #e6f3ff 100%);
      border-radius: 10px;
      border: 1px solid #e0e7ff;
    }

    .account-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px 12px;
    }

    .account-menu .avatar {
      height: 40px;
      width: 40px;
      border-radius: 50%;
      background: #ff9900;
      color: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
    }

    .account-menu .greeting {
      font-weight: 700;
      font-size: 14px;
    }

    .account-menu .sub {
      color: #555;
      font-size: 12px;
    }

    .account-menu-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      padding: 12px 8px 8px;
      background: #fff;
      border-radius: 0 0 10px 10px;
    }

    .account-col h4 {
      margin: 0 0 6px 8px;
      font-size: 13px;
      font-weight: 700;
      color: #111;
    }

    .account-col button[mat-menu-item] {
      height: 36px;
      font-size: 13px;
    }

    /* GUEST MENU STYLES */
    .guest-menu-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px 12px;
    }

    .guest-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ff9900;
    }

    .guest-actions {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #fff;
    }

    .sign-in-btn,
    .sign-up-btn {
      width: 100%;
      height: 44px !important;
      font-weight: 600 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }

    .sign-in-btn {
      background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%) !important;
    }

    .sign-up-btn {
      border: 2px solid #ff9900 !important;
      color: #ff9900 !important;
    }

    .guest-links {
      padding: 8px 0;
      background: #fff;
    }

    .guest-links button[mat-menu-item] {
      height: 40px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .guest-links button[mat-menu-item]:hover {
      background: #f0f8ff;
    }

    .account-col button[mat-menu-item] mat-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .menu-btn,
    .menu-item {
      color: #fff;
      font-size: 13px;
      padding: 8px 12px;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
    }

    .menu-btn {
      border-right: 1px solid #444;
    }

    .menu-item:hover {
      background: #ff9900;
      color: #000;
    }

    /* MAIN LAYOUT */
    .main-wrapper {
      display: flex;
      min-height: calc(100vh - 140px);
      background: #f5f5f5;
    }

    mat-sidenav-container {
      width: 100%;
    }

    .sidebar {
      width: 280px;
      background: #f3f3f3;
      border-right: 1px solid #ddd;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: linear-gradient(135deg, #232f3e 0%, #37475a 100%);
      border-bottom: 1px solid #d0d0d0;
      color: #fff;
    }

    .sidebar-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .user-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #ff9900;
    }

    .sidebar-greeting {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
    }

    .sidebar-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #fff;
    }

    .sidebar-close {
      height: 32px;
      width: 32px;
      color: #fff;
    }

    .sidebar-signin-btn {
      width: calc(100% - 32px);
      margin: 16px;
      height: 44px !important;
      font-weight: 600 !important;
      background: linear-gradient(135deg, #ff9900 0%, #ff7700 100%) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
    }

    .sidebar-section {
      padding: 16px 0;
    }

    .sidebar-section h3 {
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 700;
      color: #111;
      background: #e5e5e5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    mat-nav-list {
      padding: 0;
    }

    mat-list-item {
      height: 40px;
      color: #111;
    }

    mat-list-item:hover {
      background: #e8e8e8;
    }

    mat-list-item.active {
      background: #ddd;
      border-left: 4px solid #ff9900;
    }

    .content {
      flex: 1;
      overflow: auto;
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

      .sidebar {
        display: none;
      }

      .content {
        width: 100%;
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
        } catch (e) {
          this.currentUsername = username || userId || 'User';
        }
      } else {
        this.currentUsername = username || userId || 'User';
      }
    } else {
      this.currentUsername = '';
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
    alert('Customer Service: Contact us at support@myindianstore.com or call 1800-XXX-XXXX');
  }
}
