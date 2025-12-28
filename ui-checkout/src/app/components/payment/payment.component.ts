import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="payment-container">
      <div class="form-section">
        <h2>Payment Information</h2>
        
        <div *ngIf="error" class="error-message">{{ error }}</div>
        
        <mat-form-field>
          <mat-label>Cardholder Name</mat-label>
          <input matInput [(ngModel)]="paymentData.cardName" placeholder="Name on card">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Card Number</mat-label>
          <input matInput [(ngModel)]="paymentData.cardNumber" placeholder="1234 5678 9012 3456">
        </mat-form-field>

        <div class="row">
          <mat-form-field class="col-md-6">
            <mat-label>Expiry Date</mat-label>
            <input matInput [(ngModel)]="paymentData.expiryDate" placeholder="MM/YY">
          </mat-form-field>
          <mat-form-field class="col-md-6">
            <mat-label>CVV</mat-label>
            <input matInput [(ngModel)]="paymentData.cvv" placeholder="123">
          </mat-form-field>
        </div>

        <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>
        
        <button mat-raised-button color="primary" (click)="processPayment()" [disabled]="loading">
          Complete Purchase
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-container {
      max-width: 600px;
      margin: 2rem auto;
      background: white;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .form-section {
      padding: 2rem;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    .row {
      display: flex;
      gap: 1rem;
    }
    .col-md-6 {
      flex: 1;
    }
    .error-message {
      color: #d32f2f;
      background-color: #ffebee;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    mat-spinner {
      margin: 1rem 0;
    }
  `]
})
export class PaymentComponent implements OnInit {
  paymentData = { cardName: '', cardNumber: '', expiryDate: '', cvv: '' };
  loading = false;
  error: string | null = null;

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void { }

  processPayment(): void {
    if (!this.paymentData.cardName || !this.paymentData.cardNumber || !this.paymentData.expiryDate || !this.paymentData.cvv) {
      this.error = 'Please fill in all payment details';
      return;
    }

    this.loading = true;
    this.error = null;
    this.paymentService.processPayment(this.paymentData).subscribe({
      next: (response) => {
        this.loading = false;
        alert('Payment processed successfully');
        window.location.href = '/';
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Payment processing failed. Please try again.';
      }
    });
  }
}
