import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRippleModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';
import { AuthComponent } from '../auth/auth.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule,
    MatRippleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="storefront">

      <!-- ── DEALS HERO CAROUSEL ─────────────────────────────────────── -->
      <section class="hero-carousel">
        <div class="carousel-track" [style.transform]="'translateX(-' + (activeSlide * 100) + '%)'">
          <div class="carousel-slide" *ngFor="let banner of heroBanners" [style.background]="banner.bg">
            <div class="slide-content">
              <span class="slide-tag">{{ banner.tag }}</span>
              <h1>{{ banner.title }}</h1>
              <p>{{ banner.subtitle }}</p>
              <button class="slide-cta" (click)="router.navigate(['/products'])">{{ banner.cta }}</button>
            </div>
            <div class="slide-graphic">
              <mat-icon class="slide-icon">{{ banner.icon }}</mat-icon>
            </div>
          </div>
        </div>
        <button class="carousel-btn prev" (click)="prevSlide()">&#8249;</button>
        <button class="carousel-btn next" (click)="nextSlide()">&#8250;</button>
        <div class="carousel-dots">
          <span *ngFor="let b of heroBanners; let i = index" 
                class="dot" [class.active]="i === activeSlide" (click)="goToSlide(i)"></span>
        </div>
      </section>

      <!-- ── QUICK CATEGORY TILES ───────────────────────────────────── -->
      <section class="category-tiles">
        <div class="tile" *ngFor="let cat of categoryTiles" matRipple (click)="goToCategory(cat.key)">
          <div class="tile-icon" [style.background]="cat.color">
            <mat-icon>{{ cat.icon }}</mat-icon>
          </div>
          <span>{{ cat.label }}</span>
        </div>
      </section>

      <!-- ── TODAY'S DEALS ──────────────────────────────────────────── -->
      <section class="deals-section">
        <div class="section-header">
          <h2>Today's Deals</h2>
          <span class="countdown" *ngIf="dealsCountdown">Ends in: <strong>{{ dealsCountdown }}</strong></span>
          <a class="see-all" (click)="router.navigate(['/products'])">See all deals <mat-icon>chevron_right</mat-icon></a>
        </div>
        <div class="loading-row" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner><span>Loading deals...</span>
        </div>
        <div class="deals-row" *ngIf="!loading">
          <div class="deal-card" *ngFor="let item of dealsItems" matRipple (click)="viewProduct(item)">
            <div class="deal-image" [style.background]="getItemColor(item)">
              <mat-icon>{{ getItemIcon(item) }}</mat-icon>
              <span class="deal-badge">{{ getDealDiscount(item) }}% off</span>
            </div>
            <div class="deal-info">
              <div class="deal-price">
                <span class="price-now">₹{{ getDiscountedPrice(item) | number:'1.0-0' }}</span>
                <span class="price-was">₹{{ item.price | number:'1.0-0' }}</span>
              </div>
              <div class="deal-name">{{ item.name }}</div>
              <div class="deal-rating">
                <span class="stars">{{ getStars(item) }}</span>
                <span class="review-count">({{ getReviewCount(item) }})</span>
              </div>
              <div class="deal-claim-bar">
                <div class="claim-progress" [style.width]="getClaimPercent(item) + '%'"></div>
              </div>
              <span class="claim-text">{{ getClaimPercent(item) }}% claimed</span>
            </div>
            <button class="add-deal-btn" (click)="$event.stopPropagation(); addToCart(item)">
              <mat-icon>add_shopping_cart</mat-icon> Add to Cart
            </button>
          </div>
          <div class="deal-empty" *ngIf="dealsItems.length === 0">
            <mat-icon>local_offer</mat-icon>
            <p>Check back for amazing deals!</p>
            <button mat-raised-button color="primary" (click)="router.navigate(['/products'])">Browse Products</button>
          </div>
        </div>
      </section>

      <!-- ── FEATURED CATEGORY BANNERS ──────────────────────────────── -->
      <section class="category-banners">
        <div class="banner-grid">
          <div class="banner-card" *ngFor="let banner of categoryBanners" 
               [style.background]="banner.gradient" matRipple (click)="goToCategory(banner.key)">
            <div class="banner-text">
              <h3>{{ banner.title }}</h3>
              <p>{{ banner.subtitle }}</p>
              <span class="banner-link">Shop now <mat-icon>arrow_forward</mat-icon></span>
            </div>
            <mat-icon class="banner-icon">{{ banner.icon }}</mat-icon>
          </div>
        </div>
      </section>

      <!-- ── BESTSELLERS ────────────────────────────────────────────── -->
      <section class="product-section">
        <div class="section-header">
          <h2>🏆 Bestsellers</h2>
          <a class="see-all" (click)="router.navigate(['/products'])">See all <mat-icon>chevron_right</mat-icon></a>
        </div>
        <div class="product-row" *ngIf="!loading">
          <div class="product-card" *ngFor="let item of bestsellers; let i = index" (click)="viewProduct(item)">
            <div class="rank-badge" *ngIf="i < 3">#{{ i + 1 }}</div>
            <div class="product-img" [style.background]="getItemColor(item)">
              <mat-icon>{{ getItemIcon(item) }}</mat-icon>
              <span class="prime-badge" *ngIf="item.price > 500">prime</span>
            </div>
            <div class="product-body">
              <div class="product-name">{{ item.name }}</div>
              <div class="product-rating">
                <span class="stars">{{ getStars(item) }}</span>
                <span class="review-cnt">({{ getReviewCount(item) }})</span>
              </div>
              <div class="product-price">
                <span class="main-price">₹{{ item.price | number:'1.0-0' }}</span>
                <span class="free-delivery" *ngIf="item.price >= 499">Free Delivery</span>
              </div>
              <button class="add-btn" (click)="$event.stopPropagation(); addToCart(item)">
                Add to Cart
              </button>
            </div>
          </div>
          <div class="empty-section" *ngIf="bestsellers.length === 0 && !loading">
            <mat-icon>inventory_2</mat-icon><p>No products available</p>
          </div>
        </div>
      </section>

      <!-- ── NEW RELEASES ────────────────────────────────────────────── -->
      <section class="product-section alt-bg">
        <div class="section-header">
          <h2>🆕 New Releases</h2>
          <a class="see-all" (click)="router.navigate(['/products'])">See all <mat-icon>chevron_right</mat-icon></a>
        </div>
        <div class="product-row" *ngIf="!loading">
          <div class="product-card" *ngFor="let item of newReleases" (click)="viewProduct(item)">
            <div class="new-badge">New</div>
            <div class="product-img" [style.background]="getItemColor(item)">
              <mat-icon>{{ getItemIcon(item) }}</mat-icon>
            </div>
            <div class="product-body">
              <div class="product-name">{{ item.name }}</div>
              <div class="product-rating">
                <span class="stars">{{ getStars(item) }}</span>
                <span class="review-cnt">({{ getReviewCount(item) }})</span>
              </div>
              <div class="product-price">
                <span class="main-price">₹{{ item.price | number:'1.0-0' }}</span>
              </div>
              <button class="add-btn" (click)="$event.stopPropagation(); addToCart(item)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── PRIME PROMO BANNER ──────────────────────────────────────── -->
      <section class="prime-banner">
        <div class="prime-content">
          <mat-icon class="prime-logo">star</mat-icon>
          <div class="prime-text">
            <h2>My Indian Store Prime</h2>
            <p>Free delivery on orders ₹499+, exclusive deals, early access to sales</p>
          </div>
          <button class="prime-btn" (click)="router.navigate(['/subscriptions'])">
            Try Prime Free
          </button>
        </div>
      </section>

      <!-- ── RECENTLY VIEWED ─────────────────────────────────────────── -->
      <section class="product-section" *ngIf="recentItems.length > 0">
        <div class="section-header">
          <h2>🕐 Recently Viewed</h2>
        </div>
        <div class="product-row">
          <div class="product-card" *ngFor="let item of recentItems" (click)="viewProduct(item)">
            <div class="product-img" [style.background]="getItemColor(item)">
              <mat-icon>{{ getItemIcon(item) }}</mat-icon>
            </div>
            <div class="product-body">
              <div class="product-name">{{ item.name }}</div>
              <div class="product-price">
                <span class="main-price">₹{{ item.price | number:'1.0-0' }}</span>
              </div>
              <button class="add-btn" (click)="$event.stopPropagation(); addToCart(item)">Add to Cart</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [`
    .storefront {
      background: #f5f5f5;
      min-height: 100vh;
    }

    /* ── HERO CAROUSEL ──────────────────────────────────────────────── */
    .hero-carousel {
      position: relative;
      overflow: hidden;
      height: 380px;
      background: #232f3e;
    }
    .carousel-track {
      display: flex;
      height: 100%;
      transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
    }
    .carousel-slide {
      min-width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 40px 80px;
      position: relative;
      overflow: hidden;
    }
    .carousel-slide::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%);
    }
    .slide-content {
      position: relative;
      z-index: 2;
      color: #fff;
      max-width: 500px;
    }
    .slide-tag {
      display: inline-block;
      background: #ff9900;
      color: #111;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }
    .slide-content h1 {
      font-size: 2.4rem;
      font-weight: 700;
      margin: 0 0 12px;
      line-height: 1.2;
      text-shadow: 1px 1px 4px rgba(0,0,0,0.4);
    }
    .slide-content p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0 0 24px;
    }
    .slide-cta {
      background: #ff9900;
      color: #111;
      border: none;
      padding: 12px 28px;
      border-radius: 4px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .slide-cta:hover { background: #e68900; }
    .slide-graphic {
      position: absolute;
      right: 60px;
      z-index: 1;
    }
    .slide-icon {
      font-size: 200px;
      width: 200px;
      height: 200px;
      opacity: 0.15;
      color: #fff;
    }
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.4);
      border: none;
      color: #fff;
      font-size: 36px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .carousel-btn:hover { background: rgba(0,0,0,0.7); }
    .carousel-btn.prev { left: 16px; }
    .carousel-btn.next { right: 16px; }
    .carousel-dots {
      position: absolute;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.5);
      cursor: pointer;
      transition: background 0.2s;
    }
    .dot.active { background: #ff9900; }

    /* ── CATEGORY TILES ─────────────────────────────────────────────── */
    .category-tiles {
      display: flex;
      gap: 0;
      background: #fff;
      border-bottom: 1px solid #ddd;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .category-tiles::-webkit-scrollbar { display: none; }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 24px;
      gap: 8px;
      cursor: pointer;
      min-width: 90px;
      border-right: 1px solid #f0f0f0;
      transition: background 0.15s;
      flex: 1;
    }
    .tile:hover { background: #fff8ee; }
    .tile-icon {
      width: 48px; height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tile-icon mat-icon {
      color: #fff;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .tile span {
      font-size: 11px;
      color: #555;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }

    /* ── SECTION HEADER ─────────────────────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px 12px;
    }
    .section-header h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #111;
      margin: 0;
      flex: 1;
    }
    .countdown {
      font-size: 13px;
      color: #c7511f;
      background: #fff3cd;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
    }
    .see-all {
      font-size: 13px;
      color: #0066c0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      text-decoration: none;
      white-space: nowrap;
    }
    .see-all:hover { color: #c7511f; text-decoration: underline; }
    .see-all mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── DEALS SECTION ──────────────────────────────────────────────── */
    .deals-section {
      background: #fff;
      margin-bottom: 12px;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
    }
    .deals-row {
      display: flex;
      gap: 12px;
      padding: 0 24px 20px;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .deals-row::-webkit-scrollbar { height: 4px; }
    .deals-row::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
    .deal-card {
      min-width: 200px;
      max-width: 200px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }
    .deal-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .deal-image {
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .deal-image mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: rgba(255,255,255,0.8);
    }
    .deal-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #cc0c39;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 7px;
      border-radius: 3px;
    }
    .deal-info {
      padding: 12px;
      flex: 1;
    }
    .deal-price { display: flex; align-items: baseline; gap: 8px; }
    .price-now { font-size: 1.2rem; font-weight: 700; color: #cc0c39; }
    .price-was { font-size: 12px; color: #888; text-decoration: line-through; }
    .deal-name {
      font-size: 13px;
      color: #111;
      margin: 6px 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .deal-rating { display: flex; align-items: center; gap: 4px; margin-bottom: 8px; }
    .stars { color: #ff9900; font-size: 13px; }
    .review-count { font-size: 11px; color: #0066c0; }
    .deal-claim-bar {
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .claim-progress { height: 100%; background: #cc0c39; border-radius: 3px; }
    .claim-text { font-size: 11px; color: #888; }
    .add-deal-btn {
      background: #ff9900;
      border: none;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      color: #111;
      transition: background 0.15s;
      width: 100%;
    }
    .add-deal-btn:hover { background: #e68900; }
    .add-deal-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .deal-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 12px;
      color: #888;
      flex: 1;
    }
    .deal-empty mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }

    /* ── CATEGORY BANNERS ───────────────────────────────────────────── */
    .category-banners { padding: 0 24px 12px; background: #f5f5f5; }
    .banner-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
    }
    .banner-card {
      border-radius: 10px;
      padding: 24px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .banner-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
    .banner-text { color: #fff; z-index: 1; }
    .banner-text h3 { font-size: 1.2rem; font-weight: 700; margin: 0 0 4px; }
    .banner-text p { font-size: 12px; opacity: 0.85; margin: 0 0 12px; }
    .banner-link {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      background: rgba(255,255,255,0.2);
      padding: 4px 10px;
      border-radius: 4px;
    }
    .banner-link mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .banner-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: rgba(255,255,255,0.2);
      flex-shrink: 0;
    }

    /* ── PRODUCT SECTIONS ───────────────────────────────────────────── */
    .product-section {
      background: #fff;
      margin-bottom: 12px;
      border-top: 1px solid #eee;
    }
    .product-section.alt-bg { background: #fafafa; }
    .product-row {
      display: flex;
      gap: 12px;
      padding: 0 24px 20px;
      overflow-x: auto;
      scrollbar-width: thin;
      flex-wrap: nowrap;
    }
    .product-row::-webkit-scrollbar { height: 4px; }
    .product-row::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
    .product-card {
      min-width: 190px;
      max-width: 190px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s;
      position: relative;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }
    .product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .rank-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #ff9900;
      color: #111;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 3px;
      z-index: 1;
    }
    .new-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #067d62;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 3px;
      z-index: 1;
    }
    .product-img {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .product-img mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: rgba(255,255,255,0.75);
    }
    .prime-badge {
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      background: #232f3e;
      color: #00a8e1;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      letter-spacing: 1px;
      font-style: italic;
    }
    .product-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
    .product-name {
      font-size: 13px;
      font-weight: 500;
      color: #111;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 6px;
      flex: 1;
    }
    .product-rating { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
    .review-cnt { font-size: 11px; color: #0066c0; }
    .product-price { margin-bottom: 8px; }
    .main-price { font-size: 1.15rem; font-weight: 700; color: #0f1111; }
    .free-delivery {
      display: block;
      font-size: 11px;
      color: #067d62;
      font-weight: 600;
    }
    .add-btn {
      background: #ff9900;
      border: none;
      padding: 8px;
      width: 100%;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 4px;
      color: #111;
      transition: background 0.15s;
    }
    .add-btn:hover { background: #e68900; }
    .empty-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: #888;
    }
    .empty-section mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: 0.4; }

    /* ── PRIME BANNER ───────────────────────────────────────────────── */
    .prime-banner {
      background: linear-gradient(135deg, #232f3e 0%, #131921 100%);
      padding: 32px 24px;
      margin-bottom: 12px;
    }
    .prime-content {
      display: flex;
      align-items: center;
      gap: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .prime-logo {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #00a8e1;
      flex-shrink: 0;
    }
    .prime-text { flex: 1; }
    .prime-text h2 { font-size: 1.4rem; font-weight: 700; color: #fff; margin: 0 0 6px; }
    .prime-text p { font-size: 14px; color: #ccc; margin: 0; }
    .prime-btn {
      background: #00a8e1;
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .prime-btn:hover { background: #0090c1; }

    @media (max-width: 768px) {
      .carousel-slide { padding: 24px 20px; }
      .slide-content h1 { font-size: 1.6rem; }
      .slide-graphic { display: none; }
      .tile { padding: 12px 16px; min-width: 72px; }
      .prime-content { flex-direction: column; text-align: center; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  featuredItems: any[] = [];
  dealsItems: any[] = [];
  bestsellers: any[] = [];
  newReleases: any[] = [];
  recentItems: any[] = [];
  loading = false;
  error: string | null = null;
  activeSlide = 0;
  dealsCountdown = '';
  private slideInterval: any;
  private countdownInterval: any;

  heroBanners = [
    {
      tag: 'Limited Time',
      title: 'Mega Sale — Up to 70% Off',
      subtitle: 'Grab the best deals on Electronics, Fashion & more',
      cta: 'Shop Now',
      icon: 'local_offer',
      bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    },
    {
      tag: 'New Arrivals',
      title: 'Latest Products Just Dropped',
      subtitle: 'Be first to get the newest collections in store',
      cta: 'Explore New',
      icon: 'new_releases',
      bg: 'linear-gradient(135deg, #0d0d0d 0%, #1a0533 50%, #330066 100%)'
    },
    {
      tag: 'Free Delivery',
      title: 'Free Delivery on Orders ₹499+',
      subtitle: 'Shop more, save more — free and fast delivery across India',
      cta: 'Start Shopping',
      icon: 'local_shipping',
      bg: 'linear-gradient(135deg, #003300 0%, #006633 50%, #009966 100%)'
    },
    {
      tag: 'Customer Picks',
      title: 'India\'s Most Loved Products',
      subtitle: 'Handpicked by millions of happy customers',
      cta: 'See Picks',
      icon: 'favorite',
      bg: 'linear-gradient(135deg, #4a0000 0%, #800020 50%, #cc0033 100%)'
    }
  ];

  categoryTiles = [
    { key: 'electronics', label: 'Electronics', icon: 'devices', color: '#1976d2' },
    { key: 'fashion', label: 'Fashion', icon: 'checkroom', color: '#e91e63' },
    { key: 'home', label: 'Home & Kitchen', icon: 'home', color: '#ff5722' },
    { key: 'books', label: 'Books', icon: 'menu_book', color: '#4caf50' },
    { key: 'sports', label: 'Sports', icon: 'sports_soccer', color: '#ff9800' },
    { key: 'beauty', label: 'Beauty', icon: 'spa', color: '#9c27b0' },
    { key: 'toys', label: 'Toys', icon: 'toys', color: '#00bcd4' },
    { key: 'grocery', label: 'Grocery', icon: 'local_grocery_store', color: '#8bc34a' },
    { key: 'automotive', label: 'Automotive', icon: 'directions_car', color: '#607d8b' },
    { key: 'all', label: 'All Products', icon: 'apps', color: '#ff9900' }
  ];

  categoryBanners = [
    { key: 'electronics', title: 'Electronics Store', subtitle: 'Mobiles, Laptops, Cameras', icon: 'devices', gradient: 'linear-gradient(135deg, #1565c0, #0d47a1)' },
    { key: 'fashion', title: 'Fashion Sale', subtitle: 'Up to 60% off on clothing', icon: 'checkroom', gradient: 'linear-gradient(135deg, #ad1457, #880e4f)' },
    { key: 'home', title: 'Home & Kitchen', subtitle: 'Furniture, Appliances & more', icon: 'home', gradient: 'linear-gradient(135deg, #ef6c00, #e65100)' },
    { key: 'sports', title: 'Sports & Fitness', subtitle: 'Equipment, Gear & Clothing', icon: 'sports_soccer', gradient: 'linear-gradient(135deg, #2e7d32, #1b5e20)' }
  ];

  constructor(
    private itemService: ItemService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.startCarousel();
    this.startCountdown();
    this.loadRecentItems();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  private startCarousel(): void {
    this.slideInterval = setInterval(() => this.nextSlide(), 5000);
  }

  private startCountdown(): void {
    const endTime = new Date();
    endTime.setHours(23, 59, 59, 0);
    this.countdownInterval = setInterval(() => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) { this.dealsCountdown = '00:00:00'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.dealsCountdown = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
  }

  nextSlide(): void {
    this.activeSlide = (this.activeSlide + 1) % this.heroBanners.length;
  }

  prevSlide(): void {
    this.activeSlide = (this.activeSlide - 1 + this.heroBanners.length) % this.heroBanners.length;
  }

  goToSlide(i: number): void {
    this.activeSlide = i;
  }

  goToCategory(key: string): void {
    if (key === 'all') {
      this.router.navigate(['/products']);
    } else {
      this.router.navigate(['/products'], { queryParams: { category: key } });
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.itemService.getItems().subscribe({
      next: (data: any[]) => {
        const items = Array.isArray(data) ? data : [];
        // Assign to different sections
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        this.dealsItems = shuffled.slice(0, 10);
        this.bestsellers = items.slice(0, 10);
        this.newReleases = [...items].reverse().slice(0, 10);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        const fallback = this.getFallbackItems();
        this.dealsItems = fallback.slice(0, 6);
        this.bestsellers = fallback;
        this.newReleases = [...fallback].reverse();
      }
    });
  }

  private loadRecentItems(): void {
    try {
      const recent = JSON.parse(localStorage.getItem('recentItems') || '[]');
      this.recentItems = recent.slice(0, 8);
    } catch { this.recentItems = []; }
  }

  viewProduct(item: any): void {
    // Store in recent items
    try {
      let recent: any[] = JSON.parse(localStorage.getItem('recentItems') || '[]');
      recent = recent.filter((r: any) => r.id !== item.id);
      recent.unshift(item);
      localStorage.setItem('recentItems', JSON.stringify(recent.slice(0, 12)));
    } catch {}
    this.router.navigate(['/products'], { queryParams: { item: item.id } });
  }

  getItemColor(item: any): string {
    const colors = [
      'linear-gradient(135deg,#1976d2,#1565c0)',
      'linear-gradient(135deg,#e91e63,#c2185b)',
      'linear-gradient(135deg,#ff5722,#e64a19)',
      'linear-gradient(135deg,#4caf50,#388e3c)',
      'linear-gradient(135deg,#ff9800,#f57c00)',
      'linear-gradient(135deg,#9c27b0,#7b1fa2)',
      'linear-gradient(135deg,#00bcd4,#0097a7)',
      'linear-gradient(135deg,#607d8b,#455a64)'
    ];
    return colors[(item.id || 0) % colors.length];
  }

  getItemIcon(item: any): string {
    const name = (item.name || '').toLowerCase();
    if (name.includes('phone') || name.includes('mobile')) return 'smartphone';
    if (name.includes('laptop') || name.includes('computer')) return 'laptop';
    if (name.includes('headphone') || name.includes('audio')) return 'headphones';
    if (name.includes('watch')) return 'watch';
    if (name.includes('camera')) return 'camera_alt';
    if (name.includes('book')) return 'menu_book';
    if (name.includes('shirt') || name.includes('cloth')) return 'checkroom';
    if (name.includes('shoe') || name.includes('footwear')) return 'directions_walk';
    if (name.includes('food') || name.includes('grocery')) return 'local_grocery_store';
    return 'inventory_2';
  }

  getStars(item: any): string {
    const rating = item.rating || (3.5 + ((item.id || 1) % 15) * 0.1);
    const clamped = Math.min(5, Math.max(1, rating));
    const full = Math.floor(clamped);
    const half = clamped % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  }

  getReviewCount(item: any): string {
    const base = (item.id || 1) * 137 % 5000 + 100;
    return base > 1000 ? (base / 1000).toFixed(1) + 'k' : String(base);
  }

  getDealDiscount(item: any): number {
    return 10 + ((item.id || 1) % 60);
  }

  getDiscountedPrice(item: any): number {
    const disc = this.getDealDiscount(item);
    return item.price * (1 - disc / 100);
  }

  getClaimPercent(item: any): number {
    return 30 + ((item.id || 1) * 17) % 60;
  }

  addToCart(item: any): void {
    const userId = localStorage.getItem('userId') || 'guest-user';
    if (userId === 'guest-user') {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existing = guestCart.find((c: any) => c.itemId === item.id);
      if (existing) { existing.quantity += 1; } 
      else { guestCart.push({ itemId: item.id, quantity: 1, name: item.name, price: item.price }); }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      const ref = this.snackBar.open(`${item.name} added to cart! Sign in to checkout.`, 'Sign In', {
        duration: 5000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['cart-snackbar']
      });
      ref.onAction().subscribe(() => this.openLoginDialog());
    } else {
      this.cartService.addToCart(userId, item.id, 1).subscribe({
        next: () => {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const existing = cart.find((c: any) => c.itemId === item.id);
          if (existing) { existing.quantity += 1; }
          else { cart.push({ itemId: item.id, quantity: 1, name: item.name, price: item.price }); }
          localStorage.setItem('cart', JSON.stringify(cart));
          window.dispatchEvent(new CustomEvent('cartUpdated'));
          this.snackBar.open(`${item.name} added to cart!`, 'View Cart', {
            duration: 3000, horizontalPosition: 'end', verticalPosition: 'top'
          });
        },
        error: () => this.snackBar.open('Could not add to cart.', 'Close', { duration: 3000 })
      });
    }
  }

  openLoginDialog(): void {
    const dialogRef = this.dialog.open(AuthComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) this.migrateGuestCart(result.userId);
    });
  }

  migrateGuestCart(userId: string): void {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    if (guestCart.length > 0) {
      guestCart.forEach((item: any) => {
        this.cartService.addToCart(userId, item.itemId, item.quantity).subscribe();
      });
      localStorage.removeItem('guestCart');
      this.snackBar.open('Your cart has been saved!', 'Close', { duration: 3000 });
    }
  }

  private getFallbackItems(): any[] {
    return [
      { id: 1, name: 'Premium Headphones', price: 2999, description: 'Hi-fi wireless headphones' },
      { id: 2, name: 'Smart Watch Pro', price: 4999, description: 'Health tracking smartwatch' },
      { id: 3, name: 'Portable Charger', price: 1499, description: '20000mAh power bank' },
      { id: 4, name: 'Bluetooth Speaker', price: 1999, description: '360° surround sound' },
      { id: 5, name: 'Laptop Bag', price: 799, description: 'Waterproof laptop bag' },
      { id: 6, name: 'USB-C Hub', price: 999, description: '7-in-1 USB-C hub' }
    ];
  }
}