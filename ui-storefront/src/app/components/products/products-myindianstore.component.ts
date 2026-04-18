import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-products-myindianstore',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="products-myindianstore-container">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/">Home</a>
        <mat-icon>chevron_right</mat-icon>
        <span>Products</span>
      </div>

      <div class="products-layout">
        <!-- Left Sidebar - Filters -->
        <aside class="filters-sidebar">
          <div class="filter-section">
            <h3>Price</h3>
            <div class="price-range">
              <div class="price-inputs">
                <input type="number" placeholder="₹Min" [(ngModel)]="priceMin" class="price-input">
                <span>-</span>
                <input type="number" placeholder="₹Max" [(ngModel)]="priceMax" class="price-input">
              </div>
              <button mat-button class="apply-btn" (click)="applyFilters()">Go</button>
            </div>
            <div class="price-options">
              <label class="checkbox-label">
                <input type="checkbox" (change)="setPriceRange(0, 500)">
                <span>Under ₹500</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" (change)="setPriceRange(500, 1000)">
                <span>₹500 - ₹1,000</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" (change)="setPriceRange(1000, 2000)">
                <span>₹1,000 - ₹2,000</span>
              </label>
              <label class="checkbox-label">
                <input type="checkbox" (change)="setPriceRange(2000, 9999999)">
                <span>Over ₹2,000</span>
              </label>
            </div>
          </div>

          <div class="filter-section">
            <h3>Deals & Discounts</h3>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="filters.allDiscounts">
              <span>All Discounts</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="filters.todayDeals">
              <span>Today's Deals</span>
            </label>
          </div>

          <div class="filter-section">
            <h3>Customer Review</h3>
            <div class="rating-options">
              <label class="checkbox-label" *ngFor="let rating of [4, 3, 2, 1]">
                <input type="checkbox" (change)="setRatingFilter(rating)">
                <div class="stars">
                  <mat-icon *ngFor="let i of [1,2,3,4,5]" [class.filled]="i <= rating">star</mat-icon>
                  <span>& Up</span>
                </div>
              </label>
            </div>
          </div>

          <div class="filter-section">
            <h3>Discount</h3>
            <label class="checkbox-label">
              <input type="checkbox" (change)="setDiscountFilter(10)">
              <span>10% Off or more</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" (change)="setDiscountFilter(25)">
              <span>25% Off or more</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" (change)="setDiscountFilter(50)">
              <span>50% Off or more</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" (change)="setDiscountFilter(70)">
              <span>70% Off or more</span>
            </label>
          </div>

          <div class="filter-section">
            <h3>Availability</h3>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="filters.inStockOnly">
              <span>Include Out of Stock</span>
            </label>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="products-main">
          <!-- Results Header -->
          <div class="results-header">
            <h1 class="results-count">
              1-{{ filteredProducts.length }} of {{ totalResults }} results for <span class="query">"{{ getDisplayTitle() }}"</span>
            </h1>
            <div class="sort-section">
              <label>Sort by:</label>
              <select [(ngModel)]="sortBy" (change)="applySorting()" class="sort-select">
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
                <option value="newest">Newest Arrivals</option>
              </select>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading products...</p>
          </div>

          <!-- Products Grid -->
          <div *ngIf="!loading && filteredProducts.length > 0" class="products-grid">
            <div *ngFor="let product of filteredProducts" class="product-card">
              <!-- Product Image -->
              <div class="product-image">
                <img [src]="product.imageUrl || 'https://via.placeholder.com/200x200?text=Product'" 
                     [alt]="product.name"
                     (error)="onImageError($event)">
                <span class="sponsored" *ngIf="product.sponsored">Sponsored</span>
              </div>

              <!-- Product Details -->
              <div class="product-details">
                <h3 class="product-title">{{ product.name }}</h3>
                
                <!-- Rating -->
                <div class="product-rating" *ngIf="product.rating">
                  <div class="stars">
                    <mat-icon *ngFor="let i of [1,2,3,4,5]" 
                              [class.filled]="i <= product.rating"
                              [class.half]="i === Math.ceil(product.rating) && product.rating % 1 !== 0">
                      star
                    </mat-icon>
                  </div>
                  <span class="rating-count">({{ product.reviewCount || 0 }})</span>
                </div>

                <!-- Price -->
                <div class="product-price">
                  <span class="discount" *ngIf="product.discount">-{{ product.discount }}%</span>
                  <span class="currency">₹</span>
                  <span class="price">{{ product.price | number:'1.0-0' }}</span>
                </div>

                <div class="original-price" *ngIf="product.originalPrice">
                  M.R.P.: <span class="strikethrough">₹{{ product.originalPrice | number:'1.0-0' }}</span>
                </div>

                <!-- Prime Badge -->
                <div class="prime-badge" *ngIf="product.prime">
                  <span class="prime-text">prime</span>
                </div>

                <!-- Delivery Info -->
                <div class="delivery-info">
                  <mat-icon>local_shipping</mat-icon>
                  <span>FREE Delivery by <strong>Tomorrow</strong></span>
                </div>

                <!-- Stock Status -->
                <div class="stock-status" [class.in-stock]="product.stock > 0" [class.low-stock]="product.stock > 0 && product.stock < 5">
                  <span *ngIf="product.stock > 0">In stock</span>
                  <span *ngIf="product.stock === 0" class="out-of-stock">Out of stock</span>
                </div>

                <!-- Add to Cart -->
                <button mat-raised-button 
                        class="add-to-cart-btn"
                        [disabled]="product.stock === 0"
                        (click)="addToCart(product)">
                  <mat-icon>shopping_cart</mat-icon>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <!-- No Results -->
          <div *ngIf="!loading && filteredProducts.length === 0" class="no-results">
            <mat-icon>search_off</mat-icon>
            <h2>No products found</h2>
            <p>Try different search terms or filters</p>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .products-myindianstore-container {
      background: white;
      min-height: 100vh;
    }

    .breadcrumb {
      background: white;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      border-bottom: 1px solid #ddd;
    }

    .breadcrumb a {
      color: #007185;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: #c7511f;
      text-decoration: underline;
    }

    .breadcrumb mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
    }

    .products-layout {
      display: flex;
      gap: 0;
    }

    /* Filters Sidebar */
    .filters-sidebar {
      width: 280px;
      background: white;
      padding: 16px;
      border-right: 1px solid #ddd;
      position: sticky;
      top: 100px;
      height: calc(100vh - 100px);
      overflow-y: auto;
    }

    .filter-section {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e7e7e7;
    }

    .filter-section:last-child {
      border-bottom: none;
    }

    .filter-section h3 {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 12px 0;
      color: #111;
    }

    .price-range {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .price-inputs {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .price-input {
      width: 70px;
      padding: 6px 8px;
      border: 1px solid #888;
      border-radius: 3px;
      font-size: 13px;
    }

    .apply-btn {
      background: #f0f2f2 !important;
      border: 1px solid #888 !important;
      border-radius: 8px !important;
      padding: 0 10px !important;
      min-width: auto !important;
      height: 29px !important;
      font-size: 13px !important;
    }

    .price-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      cursor: pointer;
      color: #565959;
    }

    .checkbox-label:hover {
      color: #c7511f;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .rating-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stars {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .stars mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ddd;
    }

    .stars mat-icon.filled {
      color: #FFA41C;
    }

    .stars span {
      margin-left: 4px;
      font-size: 13px;
    }

    /* Main Content */
    .products-main {
      flex: 1;
      padding: 16px 24px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e7e7e7;
    }

    .results-count {
      font-size: 16px;
      font-weight: 400;
      margin: 0;
      color: #565959;
    }

    .results-count .query {
      font-weight: 600;
      color: #c7511f;
    }

    .sort-section {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .sort-select {
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      font-size: 13px;
      cursor: pointer;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .product-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      transition: all 0.2s;
      cursor: pointer;
    }

    .product-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .product-image {
      position: relative;
      width: 100%;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      overflow: hidden;
    }

    .product-image img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .sponsored {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 2px;
    }

    .product-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .product-title {
      font-size: 14px;
      font-weight: 400;
      margin: 0;
      color: #007185;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-title:hover {
      color: #c7511f;
    }

    .product-rating {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rating-count {
      color: #007185;
      font-size: 13px;
    }

    .product-price {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin: 4px 0;
    }

    .discount {
      background: #CC0C39;
      color: white;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 2px;
    }

    .currency {
      font-size: 12px;
      color: #565959;
    }

    .price {
      font-size: 24px;
      font-weight: 400;
      color: #111;
    }

    .original-price {
      font-size: 12px;
      color: #565959;
    }

    .strikethrough {
      text-decoration: line-through;
    }

    .prime-badge {
      margin: 4px 0;
    }

    .prime-text {
      background: linear-gradient(to right, #00a8cc, #6dd1ed);
      color: white;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 2px;
      text-transform: lowercase;
    }

    .delivery-info {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #565959;
    }

    .delivery-info mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #007185;
    }

    .stock-status {
      font-size: 13px;
      font-weight: 600;
    }

    .stock-status.in-stock {
      color: #007600;
    }

    .stock-status.low-stock {
      color: #B12704;
    }

    .out-of-stock {
      color: #B12704;
    }

    .add-to-cart-btn {
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b) !important;
      border: 1px solid #a88734 !important;
      color: #111 !important;
      width: 100%;
      height: 36px;
      margin-top: 8px;
      font-size: 13px !important;
      border-radius: 8px !important;
    }

    .add-to-cart-btn:hover:not(:disabled) {
      background: linear-gradient(to bottom, #f5d78e, #edb932) !important;
    }

    .add-to-cart-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
    }

    .no-results {
      text-align: center;
      padding: 60px 20px;
    }

    .no-results mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #ddd;
    }

    .no-results h2 {
      margin: 20px 0 10px;
      color: #111;
    }

    .no-results p {
      color: #565959;
    }

    @media (max-width: 1024px) {
      .filters-sidebar {
        width: 220px;
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .filters-sidebar {
        display: none;
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }
  `]
})
export class ProductsMyindianstoreComponent implements OnInit {
  products: any[] = [];
  filteredProducts: any[] = [];
  totalResults = 0;
  loading = true;
  searchQuery = '';
  selectedCategory = '';
  sortBy = 'featured';
  
  priceMin: number | null = null;
  priceMax: number | null = null;

  filters = {
    allDiscounts: false,
    todayDeals: false,
    inStockOnly: false,
    minRating: 0,
    minDiscount: 0
  };

  // Category mapping for filtering
  categoryKeywords: { [key: string]: string[] } = {
    'electronics': ['laptop', 'computer', 'phone', 'tablet', 'camera', 'tv', 'audio', 'headphone', 'speaker'],
    'fashion': ['shirt', 'pant', 'dress', 'shoe', 'watch', 'bag', 'clothes', 'wear', 'jacket', 'jeans'],
    'home': ['furniture', 'kitchen', 'bed', 'table', 'chair', 'decor', 'lamp', 'curtain', 'pillow'],
    'sports': ['fitness', 'gym', 'sport', 'exercise', 'yoga', 'running', 'cycling', 'outdoor'],
    'mobiles': ['phone', 'mobile', 'smartphone', 'iphone', 'android', 'samsung', 'xiaomi'],
    'books': ['book', 'novel', 'magazine', 'comic', 'textbook', 'guide'],
    'toys': ['toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'board game'],
    'beauty': ['beauty', 'cosmetic', 'makeup', 'skincare', 'perfume', 'lotion', 'cream'],
    'bestsellers': [],
    'today-deals': [],
    'new-releases': []
  };

  Math = Math;
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private itemService: ItemService,
    private cartService: CartService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedCategory = params['category'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.itemService.getAllItems().subscribe({
      next: (items) => {
        // Transform items to include MyIndianStore-like properties
        this.products = items.map(item => ({
          ...item,
          rating: Math.random() * 2 + 3, // Random rating 3-5
          reviewCount: Math.floor(Math.random() * 5000) + 100,
          originalPrice: item.price * (1 + Math.random() * 0.5), // Add original price
          discount: Math.floor(Math.random() * 70) + 10, // Random discount 10-80%
          prime: Math.random() > 0.5,
          sponsored: Math.random() > 0.7,
          imageUrl: null
        }));
        
        this.totalResults = this.products.length;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading = false;
        this.snackBar.open('Error loading products', 'Close', { duration: 3000 });
      }
    });
  }

  setPriceRange(min: number, max: number): void {
    this.priceMin = min;
    this.priceMax = max;
    this.applyFilters();
  }

  setRatingFilter(rating: number): void {
    this.filters.minRating = rating;
    this.applyFilters();
  }

  setDiscountFilter(discount: number): void {
    this.filters.minDiscount = discount;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(product => {
      // Category filter
      if (this.selectedCategory) {
        const keywords = this.categoryKeywords[this.selectedCategory] || [];
        if (keywords.length > 0) {
          const productText = `${product.name} ${product.description || ''}`.toLowerCase();
          const matchesCategory = keywords.some(keyword => productText.includes(keyword.toLowerCase()));
          if (!matchesCategory) return false;
        }
      }

      // Search query filter
      if (this.searchQuery) {
        const productText = `${product.name} ${product.description || ''}`.toLowerCase();
        if (!productText.includes(this.searchQuery.toLowerCase())) return false;
      }

      // Price filter
      if (this.priceMin !== null && product.price < this.priceMin) return false;
      if (this.priceMax !== null && product.price > this.priceMax) return false;

      // Rating filter
      if (this.filters.minRating > 0 && product.rating < this.filters.minRating) return false;

      // Discount filter
      if (this.filters.minDiscount > 0 && product.discount < this.filters.minDiscount) return false;

      // Stock filter
      if (!this.filters.inStockOnly && product.stock === 0) return false;

      return true;
    });

    this.applySorting();
  }

  applySorting(): void {
    switch (this.sortBy) {
      case 'price-low':
        this.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        this.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        this.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        this.filteredProducts.reverse();
        break;
      default:
        // Featured - keep original order
        break;
    }
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

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/200x200?text=Product';
  }

  getDisplayTitle(): string {
    if (this.searchQuery) {
      return this.searchQuery;
    }
    if (this.selectedCategory) {
      const categoryNames: { [key: string]: string } = {
        'electronics': 'Electronics',
        'fashion': 'Fashion',
        'home': 'Home & Kitchen',
        'sports': 'Sports & Fitness',
        'mobiles': 'Mobiles & Tablets',
        'books': 'Books',
        'toys': 'Toys & Games',
        'beauty': 'Beauty & Personal Care',
        'bestsellers': 'Bestsellers',
        'today-deals': "Today's Deals",
        'new-releases': 'New Releases'
      };
      return categoryNames[this.selectedCategory] || this.selectedCategory;
    }
    return 'all products';
  }
}
