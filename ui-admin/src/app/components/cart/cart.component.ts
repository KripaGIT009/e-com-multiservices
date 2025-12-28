import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService, Cart, CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Shopping Cart</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="cart && cart.items && cart.items.length > 0; else emptyCart">
          <table mat-table [dataSource]="cart.items" class="full-width">
            <ng-container matColumnDef="itemId">
              <th mat-header-cell *matHeaderCellDef>Item ID</th>
              <td mat-cell *matCellDef="let item">{{item.itemId}}</td>
            </ng-container>

            <ng-container matColumnDef="itemName">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let item">{{item.itemName || 'N/A'}}</td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Quantity</th>
              <td mat-cell *matCellDef="let item">
                <input matInput type="number" [(ngModel)]="item.quantity" min="1" 
                       (change)="updateQuantity(item)" style="width: 60px;">
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let item">{{item.price || 0 | currency}}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button color="warn" (click)="removeItem(item.itemId)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <div style="margin-top: 20px; text-align: right;">
            <h3>Total: {{cart.totalAmount || calculateTotal() | currency}}</h3>
            <button mat-raised-button color="warn" (click)="clearCart()" style="margin-right: 10px;">
              Clear Cart
            </button>
            <button mat-raised-button color="primary" (click)="proceedToCheckout()">
              Proceed to Checkout
            </button>
          </div>
        </div>

        <ng-template #emptyCart>
          <div style="text-align: center; padding: 40px;">
            <mat-icon style="font-size: 64px; height: 64px; width: 64px; color: #ccc;">shopping_cart</mat-icon>
            <p>Your cart is empty</p>
            <button mat-raised-button color="primary" routerLink="/items">Browse Items</button>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
    table {
      width: 100%;
    }
  `]
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  displayedColumns: string[] = ['itemId', 'itemName', 'quantity', 'price', 'actions'];

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    const userId = 'user123'; // Replace with actual logged-in user
    this.cartService.getCart(userId).subscribe({
      next: (cart) => {
        this.cart = cart;
      },
      error: () => {
        this.snackBar.open('Error loading cart', 'Close', { duration: 3000 });
      }
    });
  }

  updateQuantity(item: CartItem) {
    const userId = 'user123';
    this.cartService.updateItem(userId, item.itemId, item.quantity).subscribe({
      next: () => {
        this.snackBar.open('Quantity updated', 'Close', { duration: 2000 });
        this.loadCart();
      },
      error: () => {
        this.snackBar.open('Error updating quantity', 'Close', { duration: 3000 });
      }
    });
  }

  removeItem(itemId: number) {
    const userId = 'user123';
    this.cartService.removeItem(userId, itemId).subscribe({
      next: () => {
        this.snackBar.open('Item removed', 'Close', { duration: 2000 });
        this.loadCart();
      },
      error: () => {
        this.snackBar.open('Error removing item', 'Close', { duration: 3000 });
      }
    });
  }

  clearCart() {
    const userId = 'user123';
    this.cartService.clearCart(userId).subscribe({
      next: () => {
        this.snackBar.open('Cart cleared', 'Close', { duration: 2000 });
        this.cart = null;
      },
      error: () => {
        this.snackBar.open('Error clearing cart', 'Close', { duration: 3000 });
      }
    });
  }

  proceedToCheckout() {
    // Navigate to checkout
    window.location.href = '/checkout';
  }

  calculateTotal(): number {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  }
}
