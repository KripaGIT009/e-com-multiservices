import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { FormsModule } from '@angular/forms';
import { CartService } from './services/cart.service';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSelectModule,
    MatDividerModule,
    MatSidenavModule,
    MatListModule
  ],
  template: `
    <div class="app-wrapper">
      <!-- Custom Sidebar Overlay -->
      <div class="sidebar-backdrop" *ngIf="sidebarOpen" (click)="closeSidebar()"></div>
      
      <!-- Custom Sidebar -->
      <div class="custom-sidebar" [ngClass]="{'sidebar-open': sidebarOpen}">
        <div class="sidenav-header">
          <div class="user-info" *ngIf="isLoggedIn">
            <mat-icon>account_circle</mat-icon>
            <span>Hello, {{username}}</span>
          </div>
          <div class="user-info" *ngIf="!isLoggedIn">
            <mat-icon>account_circle</mat-icon>
            <span>Hello, sign in</span>
          </div>
          <button mat-icon-button class="close-btn" (click)="closeSidebar()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="sidenav-content">
          <!-- Trending -->
          <div class="menu-section">
            <div class="section-header">Trending</div>
            <div class="menu-item" (click)="navigateAndClose('/products', {category: 'bestsellers'})">
              Bestsellers
            </div>
            <div class="menu-item" (click)="navigateAndClose('/products', {category: 'new-releases'})">
              New Releases
            </div>
            <div class="menu-item" (click)="navigateAndClose('/products', {category: 'today-deals'})">
              Movers and Shakers
            </div>
          </div>

          <div class="divider"></div>

          <!-- Digital Content and Devices -->
          <div class="menu-section">
            <div class="section-header">Digital Content and Devices</div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'electronics'})">
              <span>Echo & Alexa</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'electronics'})">
              <span>Fire TV</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'books'})">
              <span>Kindle E-Readers & eBooks</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'books'})">
              <span>Audible Audiobooks</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'books'})">
              <span>MyIndianStore Prime Video</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'books'})">
              <span>MyIndianStore Prime Music</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Shop by Category -->
          <div class="menu-section">
            <div class="section-header">Shop by Category</div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'mobiles'})">
              <span>Mobiles, Computers</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'electronics'})">
              <span>TV, Appliances, Electronics</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'fashion'})">
              <span>Men's Fashion</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products', {category: 'fashion'})">
              <span>Women's Fashion</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="see-all" (click)="navigateAndClose('/products')">
              <span>See all</span>
              <mat-icon class="dropdown-arrow">keyboard_arrow_down</mat-icon>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Programs & Features -->
          <div class="menu-section">
            <div class="section-header">Programs & Features</div>
            <div class="menu-item with-arrow" (click)="navigateAndClose('/products')">
              <span>Gift Cards & Mobile Recharges</span>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </div>
            <div class="menu-item" (click)="navigateAndClose('/products')">
              MyIndianStore Launchpad
            </div>
            <div class="menu-item" (click)="navigateAndClose('/products')">
              MyIndianStore Business
            </div>
            <div class="menu-item" (click)="navigateAndClose('/products')">
              Handloom and Handicrafts
            </div>
          </div>

          <div class="divider"></div>

          <!-- Help & Settings -->
          <div class="menu-section">
            <div class="section-header">Help & Settings</div>
            <div class="menu-item" (click)="navigateAndClose('/profile')" *ngIf="isLoggedIn">
              Your Account
            </div>
            <div class="menu-item" (click)="navigateAndClose('/auth')" *ngIf="!isLoggedIn">
              Sign in
            </div>
            <div class="menu-item" (click)="navigateAndClose('/orders')">
              Customer Service
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-wrapper">
          <!-- Top Nav -->
          <header class="header-section">
          <div class="nav-belt">
            <div class="nav-left">
              <!-- Logo -->
              <div class="nav-logo" routerLink="/">
                <span class="logo-text">myindiansstore</span>
                <span class="logo-in">.com</span>
              </div>

              <!-- Delivery Location -->
              <div class="nav-location">
                <mat-icon class="location-icon">location_on</mat-icon>
                <div class="location-text">
                  <span class="label">Delivering to Patna 800001</span>
                  <span class="value">Update location</span>
                </div>
              </div>
            </div>

            <!-- Search Bar -->
            <div class="nav-search">
              <select class="search-select" [(ngModel)]="selectedCategory">
                <option value="all">All</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home">Home & Kitchen</option>
                <option value="books">Books</option>
                <option value="beauty">Beauty</option>
              </select>
              <input type="text" 
                     class="search-input" 
                     placeholder="Search MyIndiansStore.com" 
                     [(ngModel)]="searchQuery"
                     (keyup.enter)="performSearch()">
              <button class="search-button" (click)="performSearch()">
                <mat-icon>search</mat-icon>
              </button>
            </div>

            <!-- Right Nav -->
            <div class="nav-right">
              <!-- Language -->
              <button mat-button class="nav-item flag-btn">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 20'%3E%3Crect fill='%23FF9933' width='28' height='6.67'/%3E%3Crect fill='%23fff' y='6.67' width='28' height='6.67'/%3E%3Crect fill='%23138808' y='13.33' width='28' height='6.67'/%3E%3C/svg%3E" 
                       alt="IN" class="flag-icon">
                <span>EN</span>
                <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon>
              </button>

              <!-- Account & Lists -->
              <button mat-button class="nav-item account-btn" [matMenuTriggerFor]="accountMenu" [matMenuTriggerData]="{}" *ngIf="!isLoggedIn">
                <div class="nav-text">
                  <span class="label">Hello, sign in</span>
                  <span class="value">Account & Lists <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon></span>
                </div>
              </button>

              <button mat-button class="nav-item account-btn" [matMenuTriggerFor]="accountMenu" [matMenuTriggerData]="{}" *ngIf="isLoggedIn">
                <div class="nav-text">
                  <span class="label">Hello, {{username}}</span>
                  <span class="value">Account & Lists <mat-icon class="dropdown-icon">arrow_drop_down</mat-icon></span>
                </div>
              </button>

              <mat-menu #accountMenu="matMenu" class="account-menu" yPosition="below" xPosition="before">
                <div *ngIf="!isLoggedIn" class="menu-signin">
                  <button mat-raised-button color="primary" routerLink="/auth" class="signin-btn">Sign in</button>
                  <p class="new-customer">New customer? <a routerLink="/auth?mode=signup">Start here.</a></p>
                </div>
                <div *ngIf="isLoggedIn" class="account-menu-content">
                  <div class="account-columns">
                    <div class="menu-column">
                      <h3 class="menu-column-title">Your Lists</h3>
                      <button mat-menu-item routerLink="/wishlist">Create a Wish List</button>
                      <button mat-menu-item routerLink="/wishlist">Wish from Any Website</button>
                      <button mat-menu-item routerLink="/wishlist">Baby Wishlist</button>
                      <button mat-menu-item routerLink="/wishlist">Discover Your Style</button>
                      <button mat-menu-item routerLink="/wishlist">Explore Showroom</button>
                    </div>
                    <div class="menu-column">
                      <h3 class="menu-column-title">Your Account</h3>
                      <button mat-menu-item routerLink="/profile">Your Account</button>
                      <button mat-menu-item routerLink="/orders">Your Orders</button>
                      <button mat-menu-item routerLink="/wishlist">Your Wish List</button>
                      <button mat-menu-item routerLink="/products">Keep shopping for</button>
                      <button mat-menu-item routerLink="/products">Your Recommendations</button>
                      <button mat-menu-item routerLink="/subscriptions">Your Prime Membership</button>
                      <button mat-menu-item routerLink="/subscriptions">Your Prime Video</button>
                      <button mat-menu-item routerLink="/subscriptions">Your Subscribe & Save Items</button>
                      <button mat-menu-item routerLink="/subscriptions">Memberships & Subscriptions</button>
                      <button mat-menu-item routerLink="/profile">Your Seller Account</button>
                      <button mat-menu-item routerLink="/profile">Manage Your Content and Devices</button>
                      <button mat-menu-item routerLink="/profile">Register for a free Business Account</button>
                    </div>
                  </div>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="logout()" class="signout-item">
                    <mat-icon>logout</mat-icon> Sign Out
                  </button>
                </div>
              </mat-menu>

              <!-- Returns & Orders -->
              <button mat-button class="nav-item" routerLink="/orders">
                <div class="nav-text">
                  <span class="label">Returns</span>
                  <span class="value">& Orders</span>
                </div>
              </button>

              <!-- Cart -->
              <button mat-button class="nav-cart" routerLink="/cart">
                <div class="cart-icon-wrapper">
                  <mat-icon class="cart-icon">shopping_cart</mat-icon>
                  <span class="custom-badge" *ngIf="cartCount > 0">{{cartCount}}</span>
                </div>
                <span class="cart-text">Cart</span>
              </button>
            </div>
          </div>

          <!-- Category Nav -->
          <nav class="nav-categories">
            <button mat-button class="nav-cat-item all-btn" (click)="openSidebar()">
              <mat-icon>menu</mat-icon> All
            </button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'bestsellers'}">Bestsellers</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'mobiles'}">Mobiles</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'electronics'}">Electronics</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'fashion'}">Fashion</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'home'}">Home & Kitchen</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'sports'}">Sports & Fitness</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'books'}">Books</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'toys'}">Toys & Games</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'beauty'}">Beauty</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'today-deals'}">Today's Deals</button>
            <button mat-button class="nav-cat-item" routerLink="/products" [queryParams]="{category: 'new-releases'}">New Releases</button>
          </nav>
        </header>

        <!-- Main Content -->
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #EAEDED;
    }

    .app-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
    }

    /* Sidebar Backdrop */
    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: block !important;
      visibility: visible !important;
    }

    /* Custom Sidebar */
    .custom-sidebar {
      position: fixed;
      top: 0;
      left: -365px;
      width: 365px;
      height: 100vh;
      background: #ffffff;
      box-shadow: 2px 0 8px rgba(0,0,0,0.25);
      z-index: 1000;
      transition: left 0.3s ease-out;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .custom-sidebar.sidebar-open {
      left: 0;
    }

    .main-wrapper {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* MyIndianStore Header */
    .myindianstore-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    /* Top Navigation Belt */
    .nav-belt {
      background: linear-gradient(135deg, #FF9933 0%, #FF7700 50%, #CC5500 100%);
      color: white;
      display: flex;
      align-items: center;
      padding: 0 16px;
      height: 60px;
      gap: 16px;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .nav-logo {
      cursor: pointer;
      padding: 8px;
      display: flex;
      align-items: baseline;
      border: 1px solid transparent;
      transition: border-color 0.2s;
    }

    .nav-logo:hover {
      border-color: white;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: white;
      font-family: Arial, sans-serif;
    }

    .logo-in {
      font-size: 14px;
      color: white;
    }

    .nav-location {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: border-color 0.2s;
    }

    .nav-location:hover {
      border-color: white;
    }

    .location-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .location-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .location-text .label {
      font-size: 11px;
      color: #ccc;
    }

    .location-text .value {
      font-size: 13px;
      font-weight: 700;
    }

    /* Search Bar */
    .nav-search {
      flex: 1;
      display: flex;
      max-width: 900px;
      height: 40px;
    }

    .search-select {
      width: 50px;
      background: #f3f3f3;
      border: none;
      border-radius: 4px 0 0 4px;
      padding: 0 4px;
      font-size: 12px;
      color: #555;
      cursor: pointer;
      outline: none;
    }

    .search-select:hover {
      background: #ddd;
    }

    .search-input {
      flex: 1;
      border: none;
      padding: 0 12px;
      font-size: 14px;
      outline: none;
    }

    .search-button {
      width: 45px;
      background: #FF9933;
      border: none;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .search-button:hover {
      background: #FF7700;
    }

    .search-button mat-icon {
      color: #131921;
    }

    /* Right Nav Items */
    .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-item {
      color: white !important;
      padding: 8px !important;
      min-width: auto !important;
      border: 1px solid transparent;
      transition: border-color 0.2s;
      height: 50px;
    }

    .nav-item:hover {
      border-color: white;
    }

    .flag-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .flag-icon {
      width: 24px;
      height: 16px;
    }

    .dropdown-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-left: -4px;
    }

    .nav-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
      text-align: left;
    }

    .nav-text .label {
      font-size: 11px;
      color: #ccc;
    }

    .nav-text .value {
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
    }

    .nav-cart {
      color: white !important;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px !important;
      border: 1px solid transparent;
      transition: border-color 0.2s;
      position: relative;
    }

    .nav-cart:hover {
      border-color: white;
    }

    .cart-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cart-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .custom-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ff5722 !important;
      color: white !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .cart-text {
      font-weight: 700;
      font-size: 13px;
    }

    ::ng-deep .mat-badge-content {
      position: absolute !important;
      right: -8px !important;
      top: -8px !important;
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      z-index: 1001 !important;
    }

    ::ng-deep .mat-badge-content.mat-badge-warn {
      background-color: #ff5722 !important;
      color: white !important;
    }

    /* Category Navigation */
    .nav-categories {
      background: #138808;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 4px;
      overflow-x: auto;
      white-space: nowrap;
    }

    .nav-categories::-webkit-scrollbar {
      height: 4px;
    }

    .nav-cat-item {
      color: white !important;
      font-size: 13px !important;
      padding: 8px 12px !important;
      min-width: auto !important;
      border: 1px solid transparent;
      transition: border-color 0.2s;
      height: 40px;
      text-transform: none;
      font-weight: 400 !important;
    }

    .nav-cat-item:hover {
      border-color: white;
    }

    .all-btn {
      font-weight: 700 !important;
      display: flex;
      align-items: center;
      gap: 6px;
      background: #1a5d1a !important;
      border-radius: 2px !important;
      margin-right: 4px !important;
    }

    .all-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Account Menu */
    ::ng-deep .mat-mdc-menu-panel.account-menu {
      min-width: 520px !important;
      max-width: 600px !important;
      max-height: 80vh !important;
      overflow-y: auto !important;
      background: #ffffff !important;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
      right: auto !important;
      left: auto !important;
    }

    ::ng-deep .cdk-overlay-pane:has(.mat-mdc-menu-panel.account-menu) {
      right: auto !important;
      left: auto !important;
    }

    ::ng-deep .cdk-overlay-pane {
      z-index: 9999 !important;
      position: fixed !important;
    }

    ::ng-deep .cdk-overlay-backdrop {
      z-index: 9998 !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .account-columns {
      display: flex !important;
      gap: 0 !important;
      padding: 16px 0 !important;
      background: #ffffff !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .menu-column {
      flex: 1 !important;
      padding: 0 16px !important;
      background: #ffffff !important;
      color: #333 !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .menu-column:first-child {
      border-right: 1px solid #e3e6e6 !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .menu-column-title {
      font-size: 12px !important;
      font-weight: 700 !important;
      color: #555 !important;
      margin: 0 0 8px 0 !important;
      padding: 0 16px !important;
      text-transform: uppercase !important;
      background: #ffffff !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .mat-mdc-menu-item {
      font-size: 13px !important;
      min-height: 36px !important;
      padding: 4px 16px !important;
      color: #333 !important;
      background: #ffffff !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .mat-mdc-menu-item:hover {
      background-color: #f0f2f2 !important;
      color: #333 !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .menu-signin {
      padding: 16px !important;
      text-align: center !important;
      background: #ffffff !important;
      color: #333 !important;
    }

    .signin-btn {
      width: 100%;
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b) !important;
      color: #111 !important;
      border: 1px solid #a88734;
      height: 40px;
    }

    .new-customer {
      margin-top: 12px;
      font-size: 12px;
      color: #111;
    }

    .new-customer a {
      color: #007185;
      text-decoration: none;
    }

    .new-customer a:hover {
      color: #c7511f;
      text-decoration: underline;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .signout-item {
      margin-top: 8px !important;
      color: #333 !important;
      background: #ffffff !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .signout-item mat-icon {
      margin-right: 8px !important;
    }

    ::ng-deep .mat-mdc-menu-panel.account-menu .mat-divider {
      margin: 0 !important;
      background-color: #e3e6e6 !important;
    }

    /* Main Content */
    .main-content {
      min-height: calc(100vh - 100px);
    }

    @media (max-width: 1024px) {
      .nav-search {
        max-width: 600px;
      }

      .nav-cat-item {
        font-size: 12px !important;
        padding: 6px 8px !important;
      }
    }

    @media (max-width: 768px) {
      .nav-belt {
        flex-wrap: wrap;
        height: auto;
        padding: 8px;
      }

      .nav-search {
        order: 3;
        width: 100%;
        margin-top: 8px;
      }

      .location-text .label {
        display: none;
      }

      .nav-text .label {
        display: none;
      }

      .nav-categories {
        overflow-x: scroll;
      }
    }

    /* Sidebar Styles */
    .sidenav-container {
      height: 100vh;
      width: 100%;
      background: white;
    }

    .category-sidenav {
      width: 365px !important;
      background: #ffffff !important;
      box-shadow: 2px 0 8px rgba(0,0,0,0.25) !important;
      z-index: 9999 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    ::ng-deep .mat-drawer-side {
      background: transparent !important;
      border: none !important;
    }

    ::ng-deep .mat-drawer {
      background: #ffffff !important;
      display: block !important;
      visibility: visible !important;
    }

    ::ng-deep .mat-drawer-inner-container {
      background: #ffffff !important;
      display: block !important;
      visibility: visible !important;
    }

    .sidenav-header {
      background: linear-gradient(to bottom, #FF9933, #FF7700);
      padding: 14px 20px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      z-index: 10001;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }

    .user-info mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .close-btn {
      color: white !important;
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10002;
    }

    .close-btn mat-icon {
      font-size: 24px;
    }

    /* Sidebar Backdrop */
    ::ng-deep .cdk-overlay-backdrop {
      background: rgba(0, 0, 0, 0.5) !important;
      z-index: 9998 !important;
    }

    ::ng-deep .cdk-overlay-pane {
      z-index: 9999 !important;
    }

    .sidenav-content {
      height: calc(100% - 64px);
      overflow-y: auto;
      overflow-x: hidden;
      background: #ffffff !important;
      display: block !important;
      visibility: visible !important;
    }

    .menu-section {
      padding: 0;
      background: #ffffff !important;
      display: block !important;
      visibility: visible !important;
    }

    .section-header {
      font-size: 18px;
      font-weight: 700;
      padding: 20px 36px 12px 36px;
      margin: 0;
      color: #0f1111;
      background: #ffffff !important;
      display: block !important;
      visibility: visible !important;
    }

    .menu-item {
      padding: 12px 36px;
      font-size: 14px;
      color: #0f1111;
      cursor: pointer;
      background: #ffffff !important;
      border: none;
      width: 100%;
      text-align: left;
      display: block !important;
      line-height: 1.4;
      transition: background-color 0.15s;
      visibility: visible !important;
      opacity: 1 !important;
    }

    .menu-item:hover {
      background: #eaeded !important;
    }

    .menu-item.with-arrow {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .menu-item.with-arrow span {
      flex: 1;
    }

    .arrow-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #565959;
      margin-left: 8px;
    }

    .see-all {
      padding: 12px 36px;
      font-size: 14px;
      color: #0f1111;
      cursor: pointer;
      background: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.15s;
    }

    .see-all:hover {
      background: #eaeded;
    }

    .dropdown-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #565959;
    }

    .divider {
      height: 1px;
      background: #e3e6e6;
      margin: 12px 0;
    }
  `]
})
export class AppMyindianstoreComponent implements OnInit, OnDestroy {
  searchQuery = '';
  selectedCategory = 'all';
  isLoggedIn = false;
  username = '';
  cartCount = 0;
  sidebarOpen = false;
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      console.log('App component ngOnInit - isBrowser:', this.isBrowser);
      
      // Check authentication status
      const user = this.authService.getCurrentUser();
      this.isLoggedIn = !!user;
      this.username = user?.username || localStorage.getItem('username') || '';
      console.log('Current user:', user, 'username from localStorage:', localStorage.getItem('username'));

      // Subscribe to auth changes
      this.subscriptions.push(
        this.authService.currentUser$.subscribe(user => {
          this.isLoggedIn = !!user;
          this.username = user?.username || '';
        })
      );

      // Subscribe to cart count (BehaviorSubject emits immediately and on each update)
      this.subscriptions.push(
        this.cartService.getCartCount().subscribe(count => {
          this.cartCount = count;
          console.log('App component received cart count update:', count, 'cartCount property now:', this.cartCount);
          this.cdr.markForCheck();
        })
      );

      // Manually trigger cart refresh to ensure initial load
      console.log('About to call cartService.refreshCart()');
      this.cartService.refreshCart();
      console.log('Called cartService.refreshCart()');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: {
          q: this.searchQuery,
          category: this.selectedCategory !== 'all' ? this.selectedCategory : undefined
        }
      });
    }
  }

  navigateAndClose(path: string, queryParams?: any): void {
    this.router.navigate([path], { queryParams });
    this.closeSidebar();
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
