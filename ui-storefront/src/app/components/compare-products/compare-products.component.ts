import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CompareService } from '../../services/compare.service';

@Component({
  selector: 'app-compare-products',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="compare-container" *ngIf="compareItems.length > 0">
      <div class="compare-header">
        <h2>Compare Products ({{ compareItems.length }}/4)</h2>
        <button mat-icon-button (click)="onClearAll()" title="Clear All">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>
              <th>Specification</th>
              <th *ngFor="let item of compareItems">
                <div class="product-header">
                  <img [src]="item.imageUrl" alt="{{ item.name }}" class="product-image">
                  <div class="product-info">
                    <p class="product-name">{{ item.name }}</p>
                    <p class="product-price">₹{{ item.price }}</p>
                  </div>
                  <button mat-icon-button (click)="onRemove(item.id)" title="Remove">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="spec-label">Price</td>
              <td *ngFor="let item of compareItems">₹{{ item.price }}</td>
            </tr>
            <tr>
              <td class="spec-label">Category</td>
              <td *ngFor="let item of compareItems">{{ item.category }}</td>
            </tr>
            <tr>
              <td class="spec-label">Description</td>
              <td *ngFor="let item of compareItems">{{ item.description }}</td>
            </tr>
            <tr>
              <td class="spec-label">Stock</td>
              <td *ngFor="let item of compareItems">
                <span [ngClass]="item.stock > 0 ? 'in-stock' : 'out-stock'">
                  {{ item.stock > 0 ? 'In Stock' : 'Out of Stock' }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="spec-label">Rating</td>
              <td *ngFor="let item of compareItems">
                <div class="rating">
                  <span class="stars">★ 4.5</span>
                </div>
              </td>
            </tr>
            <tr>
              <td class="spec-label">Action</td>
              <td *ngFor="let item of compareItems">
                <button mat-raised-button color="primary" class="add-btn">
                  Add to Cart
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="compare-empty" *ngIf="compareItems.length === 0">
      <mat-icon class="empty-icon">compare_arrows</mat-icon>
      <p>No products to compare. Add up to 4 products!</p>
    </div>
  `,
  styles: [`
    .compare-container {
      padding: 20px;
      background: white;
      border-radius: 8px;
      margin: 20px 0;
    }

    .compare-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #ff9900;
      padding-bottom: 10px;
    }

    .compare-header h2 {
      color: #232f3e;
      margin: 0;
      font-size: 24px;
    }

    .compare-table-wrapper {
      overflow-x: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .compare-table {
      width: 100%;
      border-collapse: collapse;
    }

    .compare-table thead {
      background-color: #f5f5f5;
    }

    .compare-table th, .compare-table td {
      padding: 15px;
      text-align: left;
      border-right: 1px solid #ddd;
    }

    .compare-table th:last-child, .compare-table td:last-child {
      border-right: none;
    }

    .compare-table tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .spec-label {
      font-weight: 600;
      color: #232f3e;
      background-color: #f5f5f5;
      width: 120px;
    }

    .product-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .product-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }

    .product-info {
      text-align: center;
    }

    .product-name {
      margin: 0;
      font-weight: 600;
      color: #232f3e;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 150px;
    }

    .product-price {
      margin: 5px 0 0 0;
      color: #ff9900;
      font-weight: 700;
      font-size: 16px;
    }

    .in-stock {
      color: #28a745;
      font-weight: 600;
    }

    .out-stock {
      color: #dc3545;
      font-weight: 600;
    }

    .rating {
      text-align: center;
    }

    .stars {
      color: #ff9900;
      font-weight: 600;
      font-size: 14px;
    }

    .add-btn {
      width: 100%;
      background-color: #ff9900;
      color: white;
    }

    .add-btn:hover {
      background-color: #e68a00;
    }

    .compare-empty {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 8px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin: 0 auto 20px;
    }

    .compare-empty p {
      color: #666;
      font-size: 16px;
      margin: 0;
    }
  `]
})
export class CompareProductsComponent implements OnInit {
  compareItems: any[] = [];

  constructor(private compareService: CompareService) {}

  ngOnInit(): void {
    this.compareService.compareItems$.subscribe(items => {
      this.compareItems = items;
    });
  }

  onRemove(itemId: number): void {
    this.compareService.removeFromCompare(itemId);
  }

  onClearAll(): void {
    this.compareService.clearCompare();
  }
}
