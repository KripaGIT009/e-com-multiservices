import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatStepperModule,
    MatRadioModule
  ],
  template: `
    <div class="checkout-container">
      <div class="checkout-header">
        <div class="header-content">
          <button mat-icon-button class="back-icon" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>
            <mat-icon class="checkout-icon">shopping_bag</mat-icon>
            Secure Checkout
          </h1>
          <div class="steps-indicator">
            <span class="step active">1. Shipping</span>
            <mat-icon>chevron_right</mat-icon>
            <span class="step active">2. Payment</span>
            <mat-icon>chevron_right</mat-icon>
            <span class="step">3. Review</span>
          </div>
        </div>
      </div>

      <div class="checkout-content">
        <div class="checkout-main">
          <!-- Shipping Address -->
          <div class="section-card">
            <div class="card-header">
              <div class="header-left">
                <div class="icon-wrapper shipping">
                  <mat-icon>local_shipping</mat-icon>
                </div>
                <div>
                  <h2>Shipping Address</h2>
                  <p class="subtitle">Where should we deliver your order?</p>
                </div>
              </div>
              <span class="step-badge">Step 1</span>
            </div>
            <div class="card-content">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="shippingAddress.fullName" placeholder="John Doe" class="form-input">
              </div>
              <div class="form-group">
                <label>Street Address</label>
                <input type="text" [(ngModel)]="shippingAddress.address1" placeholder="123 Main Street" class="form-input">
              </div>
              <div class="form-group">
                <label>Apartment, Suite, etc. (Optional)</label>
                <input type="text" [(ngModel)]="shippingAddress.address2" placeholder="Apt 4B" class="form-input">
              </div>
              <div class="form-row-three">
                <div class="form-group">
                  <label>City</label>
                  <input type="text" [(ngModel)]="shippingAddress.city" placeholder="New York" class="form-input">
                </div>
                <div class="form-group">
                  <label>State</label>
                  <input type="text" [(ngModel)]="shippingAddress.state" placeholder="NY" class="form-input">
                </div>
                <div class="form-group">
                  <label>ZIP Code</label>
                  <input type="text" [(ngModel)]="shippingAddress.zipCode" placeholder="10001" class="form-input">
                </div>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="section-card">
            <div class="card-header">
              <div class="header-left">
                <div class="icon-wrapper payment">
                  <mat-icon>credit_card</mat-icon>
                </div>
                <div>
                  <h2>Payment Method</h2>
                  <p class="subtitle">Choose how you'd like to pay</p>
                </div>
              </div>
              <span class="step-badge">Step 2</span>
            </div>
            <div class="card-content">
              <mat-radio-group [(ngModel)]="paymentMethod" class="payment-options">
                <div class="payment-option" [class.selected]="paymentMethod === 'card'">
                  <mat-radio-button value="card"></mat-radio-button>
                  <div class="option-content">
                    <mat-icon>credit_card</mat-icon>
                    <div class="option-text">
                      <strong>Credit/Debit Card</strong>
                      <span>Visa, Mastercard, Amex</span>
                    </div>
                  </div>
                </div>
                <div class="payment-option" [class.selected]="paymentMethod === 'upi'">
                  <mat-radio-button value="upi"></mat-radio-button>
                  <div class="option-content">
                    <mat-icon>qr_code_2</mat-icon>
                    <div class="option-text">
                      <strong>UPI</strong>
                      <span>Pay via UPI ID</span>
                    </div>
                  </div>
                </div>
                <div class="payment-option" [class.selected]="paymentMethod === 'cod'">
                  <mat-radio-button value="cod"></mat-radio-button>
                  <div class="option-content">
                    <mat-icon>payments</mat-icon>
                    <div class="option-text">
                      <strong>Cash on Delivery</strong>
                      <span>Pay when you receive</span>
                    </div>
                  </div>
                </div>
              </mat-radio-group>

              <div *ngIf="paymentMethod === 'card'" class="payment-details">
                <div class="form-group">
                  <label>Card Number</label>
                  <input type="text" [(ngModel)]="cardDetails.number" placeholder="1234 5678 9012 3456" class="form-input" maxlength="19">
                </div>
                <div class="form-row-two">
                  <div class="form-group">
                    <label>Expiry Date</label>
                    <input type="text" [(ngModel)]="cardDetails.expiry" placeholder="MM/YY" class="form-input" maxlength="5">
                  </div>
                  <div class="form-group">
                    <label>CVV</label>
                    <input type="password" [(ngModel)]="cardDetails.cvv" placeholder="123" class="form-input" maxlength="4">
                  </div>
                </div>
              </div>

              <div *ngIf="paymentMethod === 'upi'" class="payment-details">
                <div class="form-group">
                  <label>UPI ID</label>
                  <input type="text" [(ngModel)]="upiId" placeholder="yourname@upi" class="form-input">
                </div>
              </div>

              <div *ngIf="paymentMethod === 'cod'" class="payment-details">
                <div class="info-banner">
                  <mat-icon>info</mat-icon>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay with cash when your order is delivered to your doorstep.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="checkout-sidebar">
          <div class="summary-card">
            <div class="summary-header">
              <h3>Order Summary</h3>
              <span class="items-count">{{ cartItems.length }} Items</span>
            </div>
            
            <div class="summary-items">
              <div class="summary-item" *ngFor="let item of cartItems">
                <div class="item-left">
                  <div class="item-image">
                    <mat-icon>shopping_bag</mat-icon>
                  </div>
                  <div class="item-details">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-qty">Qty: {{ item.quantity }}</span>
                    <span class="item-type" *ngIf="item.itemType">{{ item.itemType }}</span>
                  </div>
                </div>
                <span class="item-price">{{ (item.price * item.quantity) | currency }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="summary-totals">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>{{ getSubtotal() | currency }}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span class="free-badge" *ngIf="shipping === 0">FREE</span>
                <span *ngIf="shipping > 0">{{ shipping | currency }}</span>
              </div>
              <div class="summary-row">
                <span>Tax (8%)</span>
                <span>{{ getTax() | currency }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="summary-total">
              <span>Total</span>
              <span class="total-amount">{{ getTotal() | currency }}</span>
            </div>

            <button 
              mat-raised-button 
              color="primary" 
              class="place-order-btn"
              (click)="placeOrder()"
              [disabled]="!isFormValid()">
              <mat-icon>lock</mat-icon>
              Place Secure Order
            </button>

            <div class="security-badges">
              <div class="badge">
                <mat-icon>verified_user</mat-icon>
                <span>Secure Payment</span>
              </div>
              <div class="badge">
                <mat-icon>local_shipping</mat-icon>
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .checkout-container {
      min-height: calc(100vh - 72px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 0;
    }

    .checkout-header {
      background: #ffffff;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .back-icon {
      color: #6b7280 !important;
    }

    .checkout-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1f2937;
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      flex: 1;
    }

    .checkout-icon {
      color: #667eea;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .steps-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .steps-indicator mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .step {
      font-weight: 500;
    }

    .step.active {
      color: #667eea;
      font-weight: 600;
    }

    .checkout-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
      padding: 32px 24px;
    }

    .checkout-main {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .card-header {
      padding: 24px;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 2px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .icon-wrapper.shipping {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .icon-wrapper.payment {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .icon-wrapper mat-icon {
      color: #ffffff;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .card-header h2 {
      margin: 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .step-badge {
      background: #667eea;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .card-content {
      padding: 32px;
    }

    .form-grid {
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.95rem;
      display: block;
    }

    .form-input {
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      background: #f8f9ff;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input::placeholder {
      color: #d1d5db;
    }

    .form-row-three {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background: #f8fafc;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-prefix {
      padding-right: 12px;
      margin-right: 4px;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-icon-prefix mat-icon {
      color: #667eea;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label {
      color: #6b7280;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-floating-label {
      color: #667eea;
    }

    ::ng-deep .mat-mdc-form-field .mdc-text-field--outlined .mdc-notched-outline {
      border-color: #e5e7eb;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: #667eea !important;
    }

    .payment-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .payment-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #ffffff;
    }

    .payment-option:hover {
      border-color: #667eea;
      background: #f8f9ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .payment-option.selected {
      border-color: #667eea;
      background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .option-content mat-icon {
      color: #667eea;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .option-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option-text strong {
      color: #1f2937;
      font-size: 1rem;
    }

    .option-text span {
      color: #6b7280;
      font-size: 0.85rem;
    }

    .payment-details {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px dashed #e5e7eb;
    }

    .info-banner {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      border-radius: 12px;
      border-left: 4px solid #667eea;
    }

    .info-banner mat-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .info-banner strong {
      color: #1e40af;
      font-size: 1rem;
      display: block;
      margin-bottom: 4px;
    }

    .info-banner p {
      margin: 0;
      color: #3730a3;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .checkout-sidebar {
      position: sticky;
      top: 96px;
      align-self: start;
      max-height: calc(100vh - 120px);
      overflow-y: auto;
    }

    .summary-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      overflow: hidden;
    }

    .summary-header {
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .items-count {
      background: rgba(255,255,255,0.25);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .summary-items {
      padding: 20px;
      max-height: 280px;
      overflow-y: auto;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .summary-item:last-child {
      border-bottom: none;
    }

    .item-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .item-image {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .item-image mat-icon {
      color: #ffffff;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .item-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.95rem;
    }

    .item-qty {
      font-size: 0.825rem;
      color: #6b7280;
    }

    .item-type {
      font-size: 0.75rem;
      color: #667eea;
      font-weight: 500;
      background: rgba(102, 126, 234, 0.1);
      padding: 2px 6px;
      border-radius: 3px;
      display: inline-block;
      margin-top: 2px;
    }

    .item-price {
      font-weight: 700;
      color: #667eea;
      font-size: 1rem;
    }

    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0 20px;
    }

    .summary-totals {
      padding: 20px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      color: #6b7280;
      font-size: 0.95rem;
    }

    .free-badge {
      background: #10b981;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .summary-total {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }

    .summary-total span:first-child {
      font-size: 1.1rem;
      font-weight: 600;
      color: #4b5563;
    }

    .total-amount {
      font-size: 1.75rem;
      font-weight: 800;
      color: #667eea;
    }

    .place-order-btn {
      width: calc(100% - 40px);
      height: 56px;
      font-size: 1.1rem;
      font-weight: 700;
      margin: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: #ffffff !important;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
      transition: all 0.3s ease;
    }

    .place-order-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(102, 126, 234, 0.45);
    }

    .place-order-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .place-order-btn mat-icon {
      margin-right: 8px;
    }

    .security-badges {
      display: flex;
      justify-content: space-around;
      padding: 16px 20px 20px;
      background: #f8fafc;
    }

    .badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 0.75rem;
    }

    .badge mat-icon {
      color: #10b981;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    @media (max-width: 968px) {
      .checkout-content {
        grid-template-columns: 1fr;
        padding: 24px 16px;
      }

      .checkout-sidebar {
        order: -1;
        position: static;
      }

      .header-content {
        flex-wrap: wrap;
        gap: 16px;
      }

      .steps-indicator {
        width: 100%;
        justify-content: center;
      }

      .form-row-three {
        grid-template-columns: 1fr;
      }

      .form-row-two {
        grid-template-columns: 1fr;
      }

      .card-content {
        padding: 24px;
      }

      .icon-wrapper {
        width: 48px;
        height: 48px;
      }

      .icon-wrapper mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  cartItems: any[] = [];
  shipping = 5.99;
  taxRate = 0.08; // 8% tax

  shippingAddress = {
    fullName: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: ''
  };

  paymentMethod = 'card';
  cardDetails = {
    number: '',
    expiry: '',
    cvv: ''
  };
  upiId = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCartItems();
    if (this.cartItems.length === 0) {
      this.router.navigate(['/']);
    }
  }

  loadCartItems(): void {
    const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
    // Mock item data - in production, fetch from API
    this.cartItems = guestCart.map((cartItem: any) => ({
      itemId: cartItem.itemId,
      name: `Product ${cartItem.itemId}`,
      price: 29.99,
      quantity: cartItem.quantity || 1
    }));
  }

  getSubtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getTax(): number {
    return this.getSubtotal() * this.taxRate;
  }

  getTotal(): number {
    return this.getSubtotal() + this.shipping + this.getTax();
  }

  isFormValid(): boolean {
    const addressValid = this.shippingAddress.fullName && 
                        this.shippingAddress.address1 && 
                        this.shippingAddress.city && 
                        this.shippingAddress.state && 
                        this.shippingAddress.zipCode;

    let paymentValid = false;
    if (this.paymentMethod === 'card') {
      paymentValid = !!(this.cardDetails.number && this.cardDetails.expiry && this.cardDetails.cvv);
    } else if (this.paymentMethod === 'upi') {
      paymentValid = !!this.upiId;
    } else if (this.paymentMethod === 'cod') {
      paymentValid = true;
    }

    return !!(addressValid && paymentValid && this.cartItems.length > 0);
  }

  placeOrder(): void {
    if (!this.isFormValid()) return;

    const order = {
      items: this.cartItems,
      shippingAddress: this.shippingAddress,
      paymentMethod: this.paymentMethod,
      paymentDetails: this.paymentMethod === 'card' ? this.cardDetails : 
                      this.paymentMethod === 'upi' ? { upiId: this.upiId } : 
                      { cod: true },
      subtotal: this.getSubtotal(),
      shipping: this.shipping,
      tax: this.getTax(),
      total: this.getTotal(),
      timestamp: new Date().toISOString()
    };

    console.log('Order placed:', order);

    // Clear cart
    localStorage.removeItem('guestCart');
    window.dispatchEvent(new Event('cartUpdated'));

    // Navigate to success page or home
    alert('Order placed successfully! Order ID: #' + Math.random().toString(36).substr(2, 9).toUpperCase());
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
