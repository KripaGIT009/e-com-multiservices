import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1><mat-icon>favorite</mat-icon> Your Wishlist</h1>
      <div class="empty-state">
        <mat-icon>favorite_border</mat-icon>
        <h2>Your wishlist is empty</h2>
        <p>Save items you love for later</p>
        <button mat-raised-button color="primary" (click)="goToShop()">
          <mat-icon>shopping_bag</mat-icon>
          Start Shopping
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { display: flex; align-items: center; gap: 12px; font-size: 32px; }
    .empty-state { text-align: center; padding: 80px 24px; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ccc; margin-bottom: 16px; }
  `]
})
export class WishlistComponent {
  constructor(private router: Router) {}
  goToShop() { this.router.navigate(['/products']); }
}
