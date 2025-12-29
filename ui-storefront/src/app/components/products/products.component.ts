import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ItemService } from '../../services/item.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule],
  template: `
    <div class="products">
      <h1>Products</h1>
      
      <div *ngIf="error" class="error-message">{{ error }}</div>
      
      <mat-spinner *ngIf="loading"></mat-spinner>
      
      <div *ngIf="!loading && items.length > 0" class="product-grid">
        <mat-card *ngFor="let item of items" class="product-card">
          <mat-card-header>
            <mat-card-title>{{ item.name }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ item.description }}</p>
            <p class="price">\${{ item.price }}</p>
            <p class="stock">Stock: {{ item.stock }}</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" [disabled]="item.stock === 0"
              (click)="addToCart(item.id)">
              Add to Cart
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div *ngIf="!loading && items.length === 0" class="no-items">
        <p>No products available</p>
      </div>
    </div>
  `,
  styles: [`
    .products {
      padding: 2rem;
    }
    
    h1 {
      margin-bottom: 2rem;
    }
    
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    
    .product-card {
      display: flex;
      flex-direction: column;
    }
    
    .price {
      font-size: 1.25rem;
      font-weight: bold;
      color: #2196F3;
    }
    
    .stock {
      font-size: 0.875rem;
      color: #666;
    }
    
    .error-message {
      color: #d32f2f;
      background-color: #ffebee;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    .no-items {
      text-align: center;
      padding: 3rem;
    }
  `]
})
export class ProductsComponent implements OnInit {
  items: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private itemService: ItemService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading = true;
    this.error = null;
    this.itemService.getItems().subscribe({
      next: (data) => {
        this.items = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load products';
        this.loading = false;
      }
    });
  }

  addToCart(itemId: string): void {
    const userId = 'user1'; // TODO: Get from auth service
    this.cartService.addToCart(userId, itemId, 1).subscribe({
      next: () => {
        alert('Item added to cart');
      },
      error: () => {
        this.error = 'Failed to add item to cart';
      }
    });
  }
}
