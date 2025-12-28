import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, RouterModule],
  template: `
    <div class="checkout-container">
      <div class="form-section">
        <h2>Order Summary</h2>
        <div class="order-summary">
          <p>Subtotal: \$99.99</p>
          <p>Shipping: \$10.00</p>
          <p class="total-amount">Total: \$109.99</p>
        </div>
      </div>

      <div class="form-section">
        <h3>Shipping Address</h3>
        <mat-form-field>
          <mat-label>Street Address</mat-label>
          <input matInput [(ngModel)]="shippingAddress.street" placeholder="Enter street address">
        </mat-form-field>
        <mat-form-field>
          <mat-label>City</mat-label>
          <input matInput [(ngModel)]="shippingAddress.city" placeholder="Enter city">
        </mat-form-field>
        <mat-form-field>
          <mat-label>Zip Code</mat-label>
          <input matInput [(ngModel)]="shippingAddress.zip" placeholder="Enter zip code">
        </mat-form-field>
      </div>

      <div class="form-section">
        <button mat-raised-button color="primary" (click)="continueToPayment()">
          Continue to Payment
        </button>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      max-width: 600px;
      margin: 2rem auto;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .form-section {
      padding: 2rem;
      border-bottom: 1px solid #eee;
    }
    .order-summary {
      background: #f9f9f9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .total-amount {
      font-size: 1.25rem;
      font-weight: bold;
      color: #2196F3;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
  `]
})
export class CheckoutComponent implements OnInit {
  shippingAddress = { street: '', city: '', zip: '' };
  loading = false;
  error: string | null = null;

  constructor(private checkoutService: CheckoutService) { }

  ngOnInit(): void { }

  continueToPayment(): void {
    if (!this.shippingAddress.street || !this.shippingAddress.city || !this.shippingAddress.zip) {
      this.error = 'Please fill in all address fields';
      return;
    }
    // Navigate to payment
    window.location.href = '/payment';
  }
}
