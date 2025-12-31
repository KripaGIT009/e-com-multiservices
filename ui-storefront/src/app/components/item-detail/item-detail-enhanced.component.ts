import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';
import { CompareService } from '../../services/compare.service';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="item-detail-container" *ngIf="item">
      <div class="breadcrumb">
        <a routerLink="/products">Products</a>
        <span>/</span>
        <a routerLink="/products" [queryParams]="{ category: item.category }">{{ item.category }}</a>
        <span>/</span>
        <span>{{ item.name }}</span>
      </div>

      <div class="item-detail-wrapper">
        <!-- Image Section -->
        <div class="image-section">
          <div class="main-image">
            <img [src]="item.imageUrl" [alt]="item.name" class="product-image">
            <span *ngIf="item.stock === 0" class="out-of-stock-badge">Out of Stock</span>
          </div>
        </div>

        <!-- Details Section -->
        <div class="details-section">
          <h1>{{ item.name }}</h1>
          
          <div class="rating-section">
            <div class="stars">
              <span *ngFor="let i of [1,2,3,4,5]" class="star" [ngClass]="i <= Math.round(averageRating) ? 'filled' : ''">★</span>
            </div>
            <span class="rating-value">{{ averageRating.toFixed(1) }} ({{ reviewCount }} reviews)</span>
          </div>

          <div class="price-section">
            <span class="price">₹{{ item.price }}</span>
            <span class="discount" *ngIf="item.discount">{{ item.discount }}% OFF</span>
          </div>

          <div class="description">
            {{ item.description }}
          </div>

          <div class="stock-info" [ngClass]="item.stock > 0 ? 'in-stock' : 'out-stock'">
            <mat-icon>{{ item.stock > 0 ? 'check_circle' : 'cancel' }}</mat-icon>
            <span>{{ item.stock > 0 ? 'In Stock - ' + item.stock + ' available' : 'Out of Stock' }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button mat-raised-button color="primary" 
                    (click)="onAddToCart()" 
                    [disabled]="item.stock === 0"
                    class="add-to-cart-btn">
              <mat-icon>shopping_cart</mat-icon>
              {{ item.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
            </button>
            
            <button mat-raised-button 
                    (click)="onAddToCompare()"
                    class="compare-btn">
              <mat-icon>compare_arrows</mat-icon>
              Compare
            </button>

            <button mat-icon-button 
                    (click)="onAddToWishlist()"
                    [color]="isInWishlist ? 'accent' : ''"
                    class="wishlist-btn">
              <mat-icon>{{ isInWishlist ? 'favorite' : 'favorite_border' }}</mat-icon>
            </button>
          </div>

          <!-- Additional Info -->
          <div class="additional-info">
            <mat-card class="info-card">
              <mat-icon>local_shipping</mat-icon>
              <h3>Free Shipping</h3>
              <p>On orders above ₹500</p>
            </mat-card>

            <mat-card class="info-card">
              <mat-icon>verified_user</mat-icon>
              <h3>100% Authentic</h3>
              <p>Original products guaranteed</p>
            </mat-card>

            <mat-card class="info-card">
              <mat-icon>undo</mat-icon>
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </mat-card>
          </div>
        </div>
      </div>

      <!-- Specifications Section -->
      <div class="specifications-section">
        <h2>Specifications</h2>
        <table class="specs-table">
          <tbody>
            <tr>
              <td class="spec-label">Category</td>
              <td>{{ item.category }}</td>
            </tr>
            <tr>
              <td class="spec-label">Brand</td>
              <td>{{ item.brand || 'N/A' }}</td>
            </tr>
            <tr>
              <td class="spec-label">SKU</td>
              <td>{{ item.id }}</td>
            </tr>
            <tr>
              <td class="spec-label">Stock Level</td>
              <td>{{ item.stock }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section">
        <h2>Customer Reviews</h2>
        <div class="review-link">
          <a routerLink="/reviews" [queryParams]="{ itemId: item.id }">
            View All Reviews & Add Your Review
            <mat-icon>arrow_forward</mat-icon>
          </a>
        </div>
      </div>

      <!-- Related Products Section -->
      <div class="related-products-section" *ngIf="relatedProducts.length > 0">
        <h2>Related Products</h2>
        <div class="related-products-grid">
          <div *ngFor="let product of relatedProducts" class="product-card">
            <img [src]="product.imageUrl" [alt]="product.name" class="product-image">
            <h4>{{ product.name }}</h4>
            <p class="price">₹{{ product.price }}</p>
            <button mat-raised-button color="primary" (click)="goToProduct(product.id)">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .item-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .breadcrumb {
      font-size: 12px;
      color: #666;
      margin-bottom: 20px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .breadcrumb a {
      color: #ff9900;
      text-decoration: none;
    }

    .item-detail-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
      background: white;
      padding: 20px;
      border-radius: 8px;
    }

    .image-section {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .main-image {
      position: relative;
      width: 100%;
      max-width: 400px;
    }

    .product-image {
      width: 100%;
      height: auto;
      border-radius: 8px;
      object-fit: cover;
    }

    .out-of-stock-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #dc3545;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
    }

    .details-section h1 {
      color: #232f3e;
      margin: 0 0 15px 0;
      font-size: 28px;
    }

    .rating-section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      color: #ccc;
      font-size: 16px;
    }

    .star.filled {
      color: #ff9900;
    }

    .rating-value {
      color: #666;
      font-size: 14px;
    }

    .price-section {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }

    .price {
      font-size: 32px;
      font-weight: 700;
      color: #ff9900;
    }

    .discount {
      background: #ff9900;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .description {
      color: #666;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .stock-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-weight: 600;
    }

    .stock-info.in-stock {
      background: #d4edda;
      color: #155724;
    }

    .stock-info.out-stock {
      background: #f8d7da;
      color: #721c24;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 30px;
    }

    .add-to-cart-btn {
      flex: 1;
      background-color: #ff9900;
      color: white;
      height: 44px;
      font-size: 16px;
      font-weight: 600;
    }

    .add-to-cart-btn:hover:not(:disabled) {
      background-color: #e68a00;
    }

    .add-to-cart-btn:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .compare-btn {
      background-color: #232f3e;
      color: white;
      height: 44px;
      font-size: 16px;
    }

    .compare-btn:hover {
      background-color: #1a232f;
    }

    .wishlist-btn {
      height: 44px;
      width: 44px;
      border: 1px solid #ddd;
    }

    .additional-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }

    .info-card {
      text-align: center;
      padding: 15px;
    }

    .info-card mat-icon {
      color: #ff9900;
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 10px;
    }

    .info-card h3 {
      margin: 10px 0 5px 0;
      font-size: 14px;
      color: #232f3e;
    }

    .info-card p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .specifications-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
    }

    .specifications-section h2 {
      color: #232f3e;
      margin-bottom: 20px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 10px;
    }

    .specs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .specs-table tbody tr {
      border-bottom: 1px solid #ddd;
    }

    .specs-table td {
      padding: 12px;
    }

    .spec-label {
      font-weight: 600;
      color: #232f3e;
      width: 150px;
      background: #f5f5f5;
    }

    .reviews-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 40px;
    }

    .reviews-section h2 {
      color: #232f3e;
      margin-bottom: 20px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 10px;
    }

    .review-link a {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: #ff9900;
      text-decoration: none;
      font-weight: 600;
    }

    .review-link a:hover {
      text-decoration: underline;
    }

    .review-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .related-products-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
    }

    .related-products-section h2 {
      color: #232f3e;
      margin-bottom: 20px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 10px;
    }

    .related-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 20px;
    }

    .product-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      transition: transform 0.2s;
    }

    .product-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .product-card .product-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .product-card h4 {
      margin: 10px 0;
      font-size: 14px;
      color: #232f3e;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-card .price {
      color: #ff9900;
      font-weight: 600;
      margin-bottom: 10px;
      display: block;
    }

    .product-card button {
      width: 100%;
      background-color: #ff9900;
      color: white;
    }

    @media (max-width: 768px) {
      .item-detail-wrapper {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .additional-info {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ItemDetailComponent implements OnInit {
  item: Item | null = null;
  relatedProducts: Item[] = [];
  averageRating = 0;
  reviewCount = 0;
  isInWishlist = false;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private itemService: ItemService,
    private cartService: CartService,
    private compareService: CompareService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadItemDetail(+id);
      }
    });
  }

  loadItemDetail(id: number): void {
    this.itemService.getItemById(id).subscribe(
      (item: Item) => {
        this.item = item;
        this.loadAverageRating();
        this.loadRelatedProducts();
      }
    );
  }

  loadAverageRating(): void {
    if (this.item) {
      // Mock average rating - would call service in real app
      this.averageRating = 4.5;
      this.reviewCount = 12;
    }
  }

  loadRelatedProducts(): void {
    if (this.item) {
      this.itemService.getItemsByCategory(this.item.category).subscribe(
        (items: Item[]) => {
          this.relatedProducts = items.filter(i => i.id !== this.item?.id).slice(0, 4);
        }
      );
    }
  }

  onAddToCart(): void {
    if (this.item && this.item.stock > 0) {
      this.cartService.addItemToCart(this.item, 1);
      this.snackBar.open('Added to cart!', 'Close', { duration: 2000 });
    }
  }

  onAddToCompare(): void {
    if (this.item) {
      this.compareService.addToCompare(this.item);
      this.snackBar.open('Added to compare!', 'Close', { duration: 2000 });
    }
  }

  onAddToWishlist(): void {
    this.isInWishlist = !this.isInWishlist;
    if (this.isInWishlist) {
      this.snackBar.open('Added to wishlist!', 'Close', { duration: 2000 });
    }
  }

  goToProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }
}
