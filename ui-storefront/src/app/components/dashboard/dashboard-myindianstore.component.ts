import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ItemService } from '../../services/item.service';

@Component({
  selector: 'app-dashboard-myindianstore',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="myindianstore-homepage">
      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <h1>Welcome to My Indian Store</h1>
          <p>Shop deals on top brands and discover savings</p>

          <button mat-raised-button class="shop-now-btn" routerLink="/products">
            <mat-icon>lock</mat-icon>
            Shop Now
          </button>
        </div>
        <div class="hero-image">
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800" alt="Shopping" />
        </div>
      </div>

      <!-- Category Cards -->
      <div class="section">
        <h2 class="section-title">Shop by Category</h2>
        <div class="category-grid">
          <div class="category-card" *ngFor="let category of categories" [routerLink]="['/products']" [queryParams]="{category: category.id}">
            <div class="category-image">
              <img [src]="category.image" [alt]="category.name" />
            </div>
            <div class="category-info">
              <h3>{{ category.name }}</h3>
              <p>{{ category.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Deal of the Day -->
      <div class="section deal-section">
        <h2 class="section-title">Today's Deals</h2>
        <div class="deals-banner">
          <div class="deal-badge">
            <span class="deal-percentage">Up to 70% OFF</span>
            <span class="deal-text">Limited Time Offers</span>
          </div>
          <button mat-raised-button class="explore-deals-btn" routerLink="/products" [queryParams]="{deals: 'today'}">
            Explore Deals
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>

      <!-- Featured Products -->
      <div class="section">
        <h2 class="section-title">Recommended for You</h2>
        <div class="products-scroll">
          <div class="product-card-mini" *ngFor="let product of featuredProducts">
            <div class="product-image-mini">
              <img [src]="product.imageUrl || 'https://via.placeholder.com/150'" [alt]="product.name" />
              <span class="prime-badge-mini" *ngIf="product.prime">prime</span>
            </div>
            <div class="product-info-mini">
              <h4>{{ product.name }}</h4>
              <div class="price-mini">
                <span class="discount-badge" *ngIf="product.discount">-{{ product.discount }}%</span>
                <span class="price-value">₹{{ product.price | number:'1.0-0' }}</span>
              </div>
              <div class="rating-mini">
                <mat-icon>star</mat-icon>
                <span>{{ product.rating || 4.2 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Services Section -->
      <div class="section services-section">
        <h2 class="section-title">Why Shop With Us</h2>
        <div class="services-grid">
          <div class="service-card">
            <mat-icon>local_shipping</mat-icon>
            <h3>Free Delivery</h3>
            <p>On orders above ₹499</p>
          </div>
          <div class="service-card">
            <mat-icon>verified_user</mat-icon>
            <h3>Secure Payment</h3>
            <p>100% secure transactions</p>
          </div>
          <div class="service-card">
            <mat-icon>replay</mat-icon>
            <h3>Easy Returns</h3>
            <p>7-day return policy</p>
          </div>
          <div class="service-card">
            <mat-icon>support_agent</mat-icon>
            <h3>24/7 Support</h3>
            <p>Always here to help</p>
          </div>
        </div>
      </div>

      <!-- Newsletter -->
      <div class="section newsletter-section">
        <div class="newsletter-content">
          <mat-icon>mail_outline</mat-icon>
          <div class="newsletter-text">
            <h3>Subscribe to our Newsletter</h3>
            <p>Get the latest deals and offers directly in your inbox</p>
          </div>
          <button mat-raised-button class="subscribe-btn">Subscribe Now</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .myindianstore-homepage {
      background: #f0f2f2;
      min-height: 100vh;
      padding-bottom: 40px;
    }

    /* Hero Banner */
    .hero-banner {
      position: relative;
      background: #37475a;
      color: white;
      padding: 60px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 40px;
      overflow: hidden;
    }

    .hero-content {
      position: relative;
      flex: 1;
      max-width: 600px;
      z-index: 1;
    }

    .hero-content h1 {
      font-size: 48px;
      font-weight: 700;
      margin: 0 0 16px 0;
      color: white;
    }

    .hero-content p {
      font-size: 20px;
      margin: 0 0 32px 0;
      opacity: 0.9;
      color: white;
    }

    .shop-now-btn {
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b) !important;
      color: #111 !important;
      border: 1px solid #a88734 !important;
      height: 48px;
      padding: 0 32px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
    }

    .shop-now-btn:hover {
      background: linear-gradient(to bottom, #f5d78e, #edb932) !important;
    }

    .hero-image {
      position: relative;
      flex: 1;
      max-width: 500px;
      z-index: 1;
    }

    .hero-image img {
      width: 100%;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      object-fit: cover;
    }

    /* Sections */
    .section {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .section-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 24px 0;
      color: #111;
    }

    /* Category Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .category-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }

    .category-image {
      height: 200px;
      overflow: hidden;
    }

    .category-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .category-info {
      padding: 16px;
    }

    .category-info h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #111;
    }

    .category-info p {
      font-size: 13px;
      color: #565959;
      margin: 0;
    }

    /* Deal Section */
    .deal-section {
      background: linear-gradient(135deg, #cc0c39 0%, #f44336 100%);
      color: white;
      border-radius: 12px;
    }

    .deals-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
    }

    .deal-badge {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .deal-percentage {
      font-size: 48px;
      font-weight: 700;
    }

    .deal-text {
      font-size: 20px;
      opacity: 0.9;
    }

    .explore-deals-btn {
      background: white !important;
      color: #cc0c39 !important;
      height: 48px;
      padding: 0 32px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
    }

    /* Featured Products */
    .products-scroll {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .product-card-mini {
      background: white;
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .product-card-mini:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .product-image-mini {
      position: relative;
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .product-image-mini img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .prime-badge-mini {
      position: absolute;
      top: 8px;
      left: 8px;
      background: linear-gradient(to right, #00a8cc, #6dd1ed);
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 2px;
    }

    .product-info-mini h4 {
      font-size: 13px;
      font-weight: 400;
      margin: 0 0 8px 0;
      color: #111;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .price-mini {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .discount-badge {
      background: #cc0c39;
      color: white;
      padding: 2px 4px;
      font-size: 10px;
      font-weight: 700;
      border-radius: 2px;
    }

    .price-value {
      font-size: 18px;
      font-weight: 600;
      color: #111;
    }

    .rating-mini {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }

    .rating-mini mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #ffa41c;
    }

    /* Services */
    .services-section {
      background: white;
      border-radius: 12px;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .service-card {
      text-align: center;
      padding: 24px;
    }

    .service-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #007185;
      margin-bottom: 16px;
    }

    .service-card h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #111;
    }

    .service-card p {
      font-size: 13px;
      color: #565959;
      margin: 0;
    }

    /* Newsletter */
    .newsletter-section {
      background: linear-gradient(135deg, #232f3e 0%, #37475a 100%);
      color: white;
      border-radius: 12px;
    }

    .newsletter-content {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 40px;
    }

    .newsletter-content mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f0c14b;
    }

    .newsletter-text {
      flex: 1;
    }

    .newsletter-text h3 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .newsletter-text p {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }

    .subscribe-btn {
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b) !important;
      color: #111 !important;
      border: 1px solid #a88734 !important;
      height: 48px;
      padding: 0 32px !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
    }

    @media (max-width: 768px) {
      .hero-banner {
        flex-direction: column;
        padding: 40px 16px;
      }

      .hero-content h1 {
        font-size: 32px;
      }

      .hero-content p {
        font-size: 16px;
      }

      .section {
        padding: 24px 16px;
      }

      .section-title {
        font-size: 22px;
      }

      .deals-banner {
        flex-direction: column;
        gap: 24px;
        text-align: center;
      }

      .newsletter-content {
        flex-direction: column;
        text-align: center;
        padding: 24px;
      }
    }
  `]
})
export class DashboardMyindianstoreComponent implements OnInit {
  categories = [
    {
      id: 'electronics',
      name: 'Electronics',
      description: 'Phones, Laptops & More',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'
    },
    {
      id: 'fashion',
      name: 'Fashion',
      description: 'Clothing & Accessories',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'
    },
    {
      id: 'home',
      name: 'Home & Kitchen',
      description: 'Furniture & Decor',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400'
    },
    {
      id: 'sports',
      name: 'Sports & Fitness',
      description: 'Equipment & Apparel',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'
    },
    {
      id: 'mobiles',
      name: 'Mobiles & Tablets',
      description: 'Latest Smartphones',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    },
    {
      id: 'books',
      name: 'Books',
      description: 'Best Sellers & More',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'
    },
    {
      id: 'toys',
      name: 'Toys & Games',
      description: 'Fun for Everyone',
      image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400'
    },
    {
      id: 'beauty',
      name: 'Beauty & Personal Care',
      description: 'Top Brands',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'
    }
  ];

  featuredProducts: any[] = [];

  constructor(private itemService: ItemService) {}

  ngOnInit(): void {
    this.loadFeaturedProducts();
  }

  loadFeaturedProducts(): void {
    this.itemService.getAllItems().subscribe({
      next: (items) => {
        this.featuredProducts = items.slice(0, 8).map(item => ({
          ...item,
          rating: (Math.random() * 2 + 3).toFixed(1),
          discount: Math.floor(Math.random() * 70) + 10,
          prime: Math.random() > 0.5,
          imageUrl: null
        }));
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
      }
    });
  }
}
