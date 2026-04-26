import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';
import { AuthComponent } from '../auth/auth.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatSliderModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatRippleModule
  ],
  template: `
    <div class="page-wrap">

      <!-- ── TOP SEARCH BAR ─────────────────────────────────────────── -->
      <div class="search-bar-row">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input type="text" placeholder="Search products, brands and more..."
                 [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" />
          <button class="search-btn" (click)="applyFilters()">Search</button>
        </div>
        <div class="sort-box">
          <label>Sort by:</label>
          <select [(ngModel)]="sortBy" (ngModelChange)="applyFilters()">
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A–Z</option>
            <option value="newest">Newest First</option>
            <option value="rating">Avg. Rating</option>
          </select>
        </div>
      </div>

      <!-- ── BREADCRUMB ─────────────────────────────────────────────── -->
      <div class="breadcrumb-row">
        <span class="bc-link" (click)="router.navigate(['/'])">Home</span>
        <mat-icon>chevron_right</mat-icon>
        <span class="bc-link" (click)="clearCategory()">All Products</span>
        <ng-container *ngIf="selectedCategory">
          <mat-icon>chevron_right</mat-icon>
          <span class="bc-current">{{ getCategoryLabel(selectedCategory) }}</span>
        </ng-container>
        <span class="result-count" *ngIf="!loading">{{ filteredItems.length }} results</span>
      </div>

      <div class="layout">

        <!-- ── LEFT SIDEBAR ───────────────────────────────────────── -->
        <aside class="sidebar">

          <!-- Category -->
          <div class="filter-section">
            <h4>Department</h4>
            <ul class="filter-list">
              <li [class.active]="!selectedCategory" (click)="setCategory(null)">
                All Products
              </li>
              <li *ngFor="let cat of categories"
                  [class.active]="selectedCategory === cat.key"
                  (click)="setCategory(cat.key)">
                <mat-icon>{{ cat.icon }}</mat-icon>{{ cat.label }}
              </li>
            </ul>
          </div>

          <!-- Price Range -->
          <div class="filter-section">
            <h4>Price</h4>
            <ul class="filter-list">
              <li *ngFor="let pr of priceRanges"
                  [class.active]="selectedPriceRange === pr.key"
                  (click)="setPriceRange(pr.key)">
                {{ pr.label }}
              </li>
            </ul>
          </div>

          <!-- Availability -->
          <div class="filter-section">
            <h4>Availability</h4>
            <label class="check-label">
              <input type="checkbox" [(ngModel)]="inStockOnly" (ngModelChange)="applyFilters()" />
              In Stock Only
            </label>
          </div>

          <!-- Discount -->
          <div class="filter-section">
            <h4>Discount</h4>
            <ul class="filter-list">
              <li *ngFor="let d of discountFilters"
                  [class.active]="selectedDiscount === d.value"
                  (click)="setDiscount(d.value)">
                {{ d.label }}
              </li>
            </ul>
          </div>

          <!-- Active filters -->
          <div class="active-filters" *ngIf="hasActiveFilters()">
            <h4>Active Filters</h4>
            <button class="clear-btn" (click)="clearAllFilters()">
              <mat-icon>clear_all</mat-icon> Clear All
            </button>
          </div>

        </aside>

        <!-- ── PRODUCT GRID ────────────────────────────────────────── -->
        <main class="product-main">

          <!-- Loading -->
          <div class="loading-wrap" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Loading products...</span>
          </div>

          <!-- Error -->
          <div class="error-banner" *ngIf="error && !loading">
            <mat-icon>error_outline</mat-icon> {{ error }}
          </div>

          <!-- No results -->
          <div class="no-results" *ngIf="!loading && filteredItems.length === 0 && !error">
            <mat-icon>search_off</mat-icon>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button mat-raised-button color="primary" (click)="clearAllFilters()">Clear Filters</button>
          </div>

          <!-- Grid -->
          <div class="product-grid" *ngIf="!loading && filteredItems.length > 0">
            <div class="p-card" *ngFor="let item of filteredItems" matRipple (click)="viewProduct(item)">

              <!-- Badges -->
              <div class="p-img" [style.background]="getItemColor(item)">
                <mat-icon class="p-icon">{{ getItemIcon(item) }}</mat-icon>
                <span class="badge-discount" *ngIf="getDealDiscount(item) > 0">
                  {{ getDealDiscount(item) }}% off
                </span>
                <span class="badge-prime" *ngIf="item.price >= 499">prime</span>
                <span class="badge-new" *ngIf="isNew(item)">New</span>
                <button class="wishlist-btn" (click)="$event.stopPropagation(); toggleWishlist(item)"
                        [class.wishlisted]="isWishlisted(item)">
                  <mat-icon>{{ isWishlisted(item) ? 'favorite' : 'favorite_border' }}</mat-icon>
                </button>
              </div>

              <div class="p-body">
                <div class="p-sponsor" *ngIf="item.price > 1000">Sponsored</div>
                <div class="p-name">{{ item.name }}</div>

                <!-- Rating -->
                <div class="p-rating">
                  <span class="stars">{{ getStars(item) }}</span>
                  <span class="rating-val">{{ getRatingValue(item) }}</span>
                  <span class="rating-cnt">({{ getReviewCount(item) }})</span>
                </div>

                <!-- Price -->
                <div class="p-price-row">
                  <div>
                    <div class="p-price">
                      <span class="rupee">₹</span>{{ getDiscountedPrice(item) | number:'1.0-0' }}
                    </div>
                    <div class="p-was" *ngIf="getDealDiscount(item) > 0">
                      M.R.P: <span>₹{{ item.price | number:'1.0-0' }}</span>
                    </div>
                    <div class="p-delivery" *ngIf="item.price >= 499">
                      <mat-icon>local_shipping</mat-icon> FREE Delivery
                    </div>
                  </div>
                </div>

                <!-- Stock -->
                <div class="p-stock">
                  <span class="in-stock" *ngIf="item.stock > 0">
                    <mat-icon>check_circle</mat-icon> In Stock ({{ item.stock }})
                  </span>
                  <span class="out-stock" *ngIf="item.stock === 0">
                    <mat-icon>cancel</mat-icon> Out of Stock
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="p-actions">
                  <button class="btn-cart" [disabled]="item.stock === 0"
                          (click)="$event.stopPropagation(); addToCart(item)">
                    <mat-icon>add_shopping_cart</mat-icon>
                    Add to Cart
                  </button>
                  <button class="btn-buy" [disabled]="item.stock === 0"
                          (click)="$event.stopPropagation(); buyNow(item)">
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap {
      background: #f0f2f2;
      min-height: 100vh;
    }

    /* ── SEARCH BAR ─────────────────────────────────────────────── */
    .search-bar-row {
      background: #232f3e;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      max-width: 800px;
    }
    .search-icon {
      padding: 0 12px;
      color: #666;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .search-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      padding: 10px 0;
      background: transparent;
    }
    .search-btn {
      background: #ff9900;
      border: none;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: #111;
    }
    .search-btn:hover { background: #e68900; }
    .sort-box {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ccc;
      font-size: 13px;
      white-space: nowrap;
    }
    .sort-box select {
      background: #3a4553;
      color: #fff;
      border: 1px solid #555;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
    }

    /* ── BREADCRUMB ─────────────────────────────────────────────── */
    .breadcrumb-row {
      background: #fff;
      padding: 8px 24px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #555;
      border-bottom: 1px solid #eee;
    }
    .bc-link {
      color: #0066c0;
      cursor: pointer;
    }
    .bc-link:hover { text-decoration: underline; }
    .bc-current { color: #111; font-weight: 600; }
    .breadcrumb-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #aaa; }
    .result-count {
      margin-left: auto;
      color: #888;
      font-size: 12px;
    }

    /* ── LAYOUT ─────────────────────────────────────────────────── */
    .layout {
      display: flex;
      align-items: flex-start;
      gap: 0;
      max-width: 1500px;
      margin: 0 auto;
      padding: 16px;
    }

    /* ── SIDEBAR ─────────────────────────────────────────────────── */
    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: #fff;
      border-radius: 8px;
      padding: 4px 0 16px;
      margin-right: 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      position: sticky;
      top: 16px;
    }
    .filter-section {
      padding: 12px 16px 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .filter-section:last-child { border-bottom: none; }
    .filter-section h4 {
      font-size: 14px;
      font-weight: 700;
      color: #111;
      margin: 0 0 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #eee;
    }
    .filter-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .filter-list li {
      padding: 5px 6px;
      font-size: 13px;
      color: #333;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .filter-list li mat-icon { font-size: 15px; width: 15px; height: 15px; color: #666; }
    .filter-list li:hover { background: #fff8ee; color: #c45500; }
    .filter-list li.active { background: #fff3cd; color: #c45500; font-weight: 600; }
    .check-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #333;
      cursor: pointer;
    }
    .active-filters h4 { color: #c45500; }
    .clear-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: 1px solid #c45500;
      color: #c45500;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 6px;
    }
    .clear-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── PRODUCT MAIN ────────────────────────────────────────────── */
    .product-main { flex: 1; min-width: 0; }
    .loading-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 40px;
      justify-content: center;
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffe0e0;
      color: #c00;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .no-results {
      text-align: center;
      padding: 60px 20px;
      background: #fff;
      border-radius: 8px;
    }
    .no-results mat-icon { font-size: 56px; width: 56px; height: 56px; color: #ccc; margin-bottom: 12px; }
    .no-results h3 { color: #555; margin: 0 0 8px; }
    .no-results p { color: #888; margin: 0 0 16px; }

    /* ── PRODUCT GRID ────────────────────────────────────────────── */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
    }
    .p-card {
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      border: 1px solid #e5e5e5;
      transition: box-shadow 0.2s, border-color 0.2s;
      display: flex;
      flex-direction: column;
    }
    .p-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      border-color: #aaa;
    }
    .p-img {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }
    .p-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: rgba(255,255,255,0.75);
    }
    .badge-discount {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #cc0c39;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .badge-prime {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      background: #232f3e;
      color: #00a8e1;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 8px;
      letter-spacing: 1px;
      font-style: italic;
    }
    .badge-new {
      position: absolute;
      top: 8px;
      right: 36px;
      background: #067d62;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .wishlist-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(255,255,255,0.85);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .wishlist-btn:hover { background: #fff; }
    .wishlist-btn.wishlisted mat-icon { color: #e31c5f; }
    .wishlist-btn mat-icon { font-size: 16px; width: 16px; height: 16px; color: #666; }

    .p-body { padding: 12px; flex: 1; display: flex; flex-direction: column; }
    .p-sponsor { font-size: 10px; color: #888; margin-bottom: 4px; }
    .p-name {
      font-size: 14px;
      font-weight: 500;
      color: #0f1111;
      margin-bottom: 6px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      flex: 1;
    }
    .p-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 6px;
    }
    .stars { color: #ff9900; font-size: 13px; letter-spacing: -1px; }
    .rating-val { font-size: 12px; color: #ff9900; font-weight: 600; }
    .rating-cnt { font-size: 12px; color: #0066c0; }
    .p-price-row { margin-bottom: 6px; }
    .p-price {
      font-size: 1.3rem;
      font-weight: 700;
      color: #0f1111;
    }
    .rupee { font-size: 0.85rem; vertical-align: top; margin-top: 4px; display: inline-block; }
    .p-was { font-size: 12px; color: #888; }
    .p-was span { text-decoration: line-through; }
    .p-delivery {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 12px;
      color: #067d62;
      font-weight: 600;
      margin-top: 2px;
    }
    .p-delivery mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .p-stock {
      font-size: 12px;
      margin-bottom: 8px;
    }
    .in-stock {
      display: flex;
      align-items: center;
      gap: 3px;
      color: #067d62;
    }
    .out-stock {
      display: flex;
      align-items: center;
      gap: 3px;
      color: #cc0c39;
    }
    .in-stock mat-icon, .out-stock mat-icon { font-size: 13px; width: 13px; height: 13px; }
    .p-actions {
      display: flex;
      gap: 6px;
      margin-top: auto;
    }
    .btn-cart {
      flex: 1;
      background: #ff9900;
      border: none;
      border-radius: 4px;
      padding: 8px 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: #111;
      transition: background 0.15s;
    }
    .btn-cart:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cart:not(:disabled):hover { background: #e68900; }
    .btn-cart mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .btn-buy {
      flex: 1;
      background: #ffd814;
      border: none;
      border-radius: 4px;
      padding: 8px 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: #111;
      transition: background 0.15s;
    }
    .btn-buy:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-buy:not(:disabled):hover { background: #f0c800; }

    @media (max-width: 768px) {
      .layout { padding: 8px; }
      .sidebar { display: none; }
      .product-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .search-bar-row { flex-direction: column; gap: 8px; }
    }
  `]
})
export class ProductsComponent implements OnInit, OnDestroy {
  items: any[] = [];
  filteredItems: any[] = [];
  loading = false;
  error: string | null = null;

  searchQuery = '';
  sortBy = 'relevance';
  selectedCategory: string | null = null;
  selectedPriceRange: string | null = null;
  selectedDiscount: number | null = null;
  inStockOnly = false;
  wishlistedIds = new Set<any>();

  private routeSub: Subscription | null = null;

  categories = [
    { key: 'electronics', label: 'Electronics', icon: 'devices' },
    { key: 'fashion', label: 'Fashion', icon: 'checkroom' },
    { key: 'home', label: 'Home & Kitchen', icon: 'home' },
    { key: 'books', label: 'Books', icon: 'menu_book' },
    { key: 'sports', label: 'Sports', icon: 'sports_soccer' },
    { key: 'beauty', label: 'Beauty', icon: 'spa' },
    { key: 'toys', label: 'Toys', icon: 'toys' },
    { key: 'grocery', label: 'Grocery', icon: 'local_grocery_store' }
  ];

  priceRanges = [
    { key: 'all', label: 'All Prices' },
    { key: 'under200', label: 'Under ₹200' },
    { key: '200to500', label: '₹200 – ₹500' },
    { key: '500to1000', label: '₹500 – ₹1,000' },
    { key: '1000to5000', label: '₹1,000 – ₹5,000' },
    { key: 'above5000', label: 'Above ₹5,000' }
  ];

  discountFilters = [
    { label: 'Any Discount', value: null },
    { label: '10% or more', value: 10 },
    { label: '25% or more', value: 25 },
    { label: '40% or more', value: 40 },
    { label: '60% or more', value: 60 }
  ];

  constructor(
    private itemService: ItemService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe(params => {
      this.selectedCategory = params['category'] || null;
      this.searchQuery = params['q'] || '';
      this.loadItems();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = Array.isArray(data) ? data : [];
        this.loading = false;
        this.applyFilters();
      },
      error: () => {
        this.error = 'Failed to load products. Please try again later.';
        this.loading = false;
        this.items = this.getFallbackItems();
        this.applyFilters();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.items];

    // Search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q) ||
        (i.itemType || '').toLowerCase().includes(q)
      );
    }

    // Category
    if (this.selectedCategory) {
      result = result.filter(i =>
        (i.itemType || '').toLowerCase().includes(this.selectedCategory!) ||
        (i.name || '').toLowerCase().includes(this.selectedCategory!)
      );
    }

    // Price range
    if (this.selectedPriceRange && this.selectedPriceRange !== 'all') {
      result = result.filter(i => {
        const p = i.price || 0;
        switch (this.selectedPriceRange) {
          case 'under200': return p < 200;
          case '200to500': return p >= 200 && p <= 500;
          case '500to1000': return p > 500 && p <= 1000;
          case '1000to5000': return p > 1000 && p <= 5000;
          case 'above5000': return p > 5000;
          default: return true;
        }
      });
    }

    // In stock
    if (this.inStockOnly) {
      result = result.filter(i => (i.stock || 0) > 0);
    }

    // Discount
    if (this.selectedDiscount !== null) {
      result = result.filter(i => this.getDealDiscount(i) >= (this.selectedDiscount!));
    }

    // Sort
    switch (this.sortBy) {
      case 'price_asc':  result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name_asc':   result.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'newest':     result.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
      case 'rating':     result.sort((a, b) => this.getRatingValue(b) - this.getRatingValue(a)); break;
    }

    this.filteredItems = result;
  }

  setCategory(key: string | null): void {
    this.selectedCategory = key;
    this.applyFilters();
  }

  clearCategory(): void { this.setCategory(null); }

  setPriceRange(key: string): void {
    this.selectedPriceRange = key === 'all' ? null : key;
    this.applyFilters();
  }

  setDiscount(value: number | null): void {
    this.selectedDiscount = value;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedCategory || this.selectedPriceRange || this.inStockOnly || this.selectedDiscount !== null || this.searchQuery);
  }

  clearAllFilters(): void {
    this.selectedCategory = null;
    this.selectedPriceRange = null;
    this.selectedDiscount = null;
    this.inStockOnly = false;
    this.searchQuery = '';
    this.sortBy = 'relevance';
    this.applyFilters();
  }

  getCategoryLabel(key: string): string {
    return this.categories.find(c => c.key === key)?.label || key;
  }

  viewProduct(item: any): void {
    this.router.navigate(['/items', item.id]);
  }

  buyNow(item: any): void {
    this.addToCart(item);
    this.router.navigate(['/cart']);
  }

  addToCart(item: any): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
      const existing = guestCart.find((c: any) => c.itemId === item.id);
      if (existing) { existing.quantity += 1; }
      else { guestCart.push({ itemId: item.id, quantity: 1, name: item.name, price: item.price }); }
      localStorage.setItem('guestCart', JSON.stringify(guestCart));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      this.snackBar.open(`"${item.name}" added to cart! Sign in to checkout.`, 'Sign In', { duration: 4000 });
      return;
    }
    this.cartService.addToCart(userId, item.id, 1).subscribe({
      next: () => {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existing = cart.find((c: any) => c.itemId === item.id);
        if (existing) { existing.quantity += 1; }
        else { cart.push({ itemId: item.id, quantity: 1, name: item.name, price: item.price }); }
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        this.snackBar.open(`"${item.name}" added to cart`, 'View Cart', { duration: 3000 })
          .onAction().subscribe(() => this.router.navigate(['/cart']));
      },
      error: () => this.snackBar.open('Failed to add to cart', 'Close', { duration: 3000 })
    });
  }

  toggleWishlist(item: any): void {
    if (this.wishlistedIds.has(item.id)) {
      this.wishlistedIds.delete(item.id);
    } else {
      this.wishlistedIds.add(item.id);
      this.snackBar.open(`"${item.name}" added to wishlist`, 'Close', { duration: 2000 });
    }
  }

  isWishlisted(item: any): boolean { return this.wishlistedIds.has(item.id); }

  getDealDiscount(item: any): number {
    const discounts: Record<number, number> = { 1: 20, 2: 35, 3: 15, 4: 50, 5: 10 };
    return discounts[(item.id % 5) + 1] || (item.id % 3 === 0 ? 25 : 0);
  }

  getDiscountedPrice(item: any): number {
    const d = this.getDealDiscount(item);
    return d > 0 ? Math.round(item.price * (1 - d / 100)) : item.price;
  }

  getItemColor(item: any): string {
    const colors = ['#1565c0','#ad1457','#ef6c00','#2e7d32','#6a1b9a','#00838f','#c62828','#4e342e'];
    return colors[item.id % colors.length];
  }

  getItemIcon(item: any): string {
    const name = (item.name || '').toLowerCase();
    const type = (item.itemType || '').toLowerCase();
    if (name.includes('phone') || name.includes('mobile') || type.includes('electronics')) return 'smartphone';
    if (name.includes('laptop') || name.includes('computer')) return 'laptop';
    if (name.includes('shirt') || name.includes('clothes') || type.includes('fashion')) return 'checkroom';
    if (name.includes('book') || type.includes('book')) return 'menu_book';
    if (name.includes('sport') || type.includes('sport')) return 'sports_soccer';
    if (name.includes('kitchen') || name.includes('home')) return 'home';
    return 'inventory_2';
  }

  getStars(item: any): string {
    const r = this.getRatingValue(item);
    const full = Math.floor(r);
    const half = r % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
  }

  getRatingValue(item: any): number {
    return 3.5 + (item.id % 3) * 0.5;
  }

  getReviewCount(item: any): number {
    return 100 + (item.id * 37) % 5000;
  }

  isNew(item: any): boolean { return item.id % 7 === 0; }

  private getFallbackItems(): any[] {
    return [
      { id: 1, name: 'Wireless Headphones Pro', price: 2499, stock: 50, itemType: 'Electronics', description: 'Premium sound quality' },
      { id: 2, name: 'Running Shoes X500', price: 1899, stock: 30, itemType: 'Sports', description: 'Lightweight comfort' },
      { id: 3, name: 'Smart Watch Series 3', price: 5999, stock: 15, itemType: 'Electronics', description: 'Track your fitness' },
      { id: 4, name: 'Cotton Casual Shirt', price: 699, stock: 100, itemType: 'Fashion', description: 'Everyday comfort' },
      { id: 5, name: 'Non-Stick Cookware Set', price: 1299, stock: 25, itemType: 'Home', description: 'Cook with ease' },
      { id: 6, name: 'Yoga Mat Premium', price: 599, stock: 40, itemType: 'Sports', description: 'Anti-slip surface' },
      { id: 7, name: 'Bluetooth Speaker', price: 1499, stock: 60, itemType: 'Electronics', description: '360° rich sound' },
      { id: 8, name: 'Skincare Essentials Kit', price: 899, stock: 35, itemType: 'Beauty', description: 'Glow naturally' }
    ];
  }
}