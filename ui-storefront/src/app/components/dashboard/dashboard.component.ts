import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRippleModule } from '@angular/material/core';
import { ItemService } from '../../services/item.service';

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
    MatRippleModule
  ],
  template: `
    <div class="storefront">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Welcome to ShopHub</h1>
          <p>Discover amazing products at unbeatable prices</p>
          <button mat-raised-button color="accent" class="hero-btn" routerLink="/products">
            <mat-icon>shopping_bag</mat-icon> Shop Now
          </button>
        </div>
      </section>

      <!-- Category Showcase -->
      <section class="categories">
        <h2>Shop by Category</h2>
        <div class="category-grid">
          <div class="category-card" *ngFor="let category of categories" matRipple>
            <div class="category-image" [ngStyle]="{'background': category.color}">
              <mat-icon class="category-icon">{{ category.icon }}</mat-icon>
            </div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.description }}</p>
            <button mat-button color="primary">Explore</button>
          </div>
        </div>
      </section>

      <!-- Featured Products -->
      <section class="featured">
        <div class="section-header">
          <h2>Featured Products</h2>
          <button mat-button color="primary" routerLink="/products">
            View All <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
        
        <div class="products-grid">
          <mat-card class="product-card" *ngFor="let item of featuredItems" matRipple>
            <div class="product-image">
              <mat-icon class="product-icon">inventory_2</mat-icon>
              <span class="badge">Sale</span>
            </div>
            <mat-card-content>
              <h3>{{ item.name }}</h3>
              <p class="sku">SKU: {{ item.sku }}</p>
              <p class="description">{{ item.description || 'Premium quality product' }}</p>
              <div class="product-footer">
                <span class="price">₹{{ item.price | number: '1.2-2' }}</span>
                <button mat-icon-button color="primary" title="Add to cart">
                  <mat-icon>add_shopping_cart</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Promotional Banner -->
      <section class="promo-banner">
        <div class="promo-content">
          <h2>Limited Time Offer</h2>
          <p>Get up to 50% off on selected items</p>
          <button mat-raised-button color="accent">Shop Deals</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .storefront {
      background: #f5f7fa;
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 80px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      animation: fadeInDown 0.8s ease-out;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 16px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .hero p {
      font-size: 1.3rem;
      margin-bottom: 32px;
      opacity: 0.95;
    }

    .hero-btn {
      padding: 12px 32px !important;
      font-size: 1rem !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
    }

    .hero-btn mat-icon {
      margin-right: 8px;
    }

    /* Categories Section */
    .categories {
      padding: 60px 40px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .categories h2 {
      font-size: 2rem;
      margin-bottom: 40px;
      color: #2c3e50;
      text-align: center;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-bottom: 60px;
    }

    .category-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .category-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .category-image {
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .category-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: white;
    }

    .category-card h3 {
      padding: 16px 16px 8px;
      margin: 0;
      font-size: 1.2rem;
      color: #2c3e50;
    }

    .category-card p {
      padding: 0 16px;
      margin: 0 0 12px 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .category-card button {
      display: block;
      margin: 0 auto 12px;
    }

    /* Featured Products Section */
    .featured {
      padding: 60px 40px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }

    .section-header h2 {
      font-size: 2rem;
      margin: 0;
      color: #2c3e50;
    }

    .section-header button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
    }

    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .product-card:hover {
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      transform: translateY(-4px);
    }

    .product-image {
      height: 200px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .product-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: white;
      opacity: 0.9;
    }

    .badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #ff6b6b;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .product-card mat-card-content {
      padding: 16px !important;
    }

    .product-card h3 {
      font-size: 1.1rem;
      margin: 0 0 8px 0;
      color: #2c3e50;
      font-weight: 600;
    }

    .sku {
      font-size: 0.8rem;
      color: #95a5a6;
      margin: 0 0 8px 0;
    }

    .description {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid #ecf0f1;
    }

    .price {
      font-size: 1.4rem;
      font-weight: 700;
      color: #667eea;
    }

    /* Promo Banner */
    .promo-banner {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      margin: 40px 0;
    }

    .promo-content h2 {
      font-size: 2rem;
      margin: 0 0 12px 0;
    }

    .promo-content p {
      font-size: 1.2rem;
      margin: 0 0 24px 0;
      opacity: 0.95;
    }

    .promo-content button {
      padding: 12px 32px !important;
      border-radius: 8px !important;
    }

    /* Animations */
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero {
        padding: 60px 20px;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .hero p {
        font-size: 1rem;
      }

      .categories, .featured {
        padding: 40px 20px;
      }

      .categories h2, .section-header h2 {
        font-size: 1.5rem;
      }

      .category-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .products-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  featuredItems: any[] = [];
  loading = false;
  error: string | null = null;

  categories = [
    {
      name: 'Electronics',
      description: 'Latest gadgets and devices',
      icon: 'devices',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      name: 'Fashion',
      description: 'Trendy clothes and accessories',
      icon: 'shopping_bag',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      name: 'Home & Kitchen',
      description: 'Everything for your home',
      icon: 'home',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      name: 'Books & Media',
      description: 'Books, movies and more',
      icon: 'library_books',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ];

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.loadFeaturedItems();
  }

  loadFeaturedItems(): void {
    this.loading = true;
    this.error = null;
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.featuredItems = Array.isArray(data) ? data.slice(0, 8) : [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load items';
        this.loading = false;
        // Fallback data
        this.featuredItems = [
          {
            id: 1,
            name: 'Premium Headphones',
            sku: 'HP-001',
            price: 2999,
            description: 'High-quality wireless headphones'
          },
          {
            id: 2,
            name: 'Smart Watch',
            sku: 'SW-001',
            price: 4999,
            description: 'Latest smartwatch with health tracking'
          },
          {
            id: 3,
            name: 'Portable Charger',
            sku: 'PC-001',
            price: 1499,
            description: 'Fast charging power bank'
          },
          {
            id: 4,
            name: 'USB-C Cable',
            sku: 'UC-001',
            price: 299,
            description: 'Durable USB-C charging cable'
          }
        ];
      }
    });
  }
}
