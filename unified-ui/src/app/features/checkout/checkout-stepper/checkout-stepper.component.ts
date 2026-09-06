import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RazorpayService, RazorpayPaymentResult } from '../../../core/services/razorpay.service';

interface CartItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
}

interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

@Component({
  selector: 'app-checkout-stepper',
  templateUrl: './checkout-stepper.component.html',
  styleUrls: ['./checkout-stepper.component.scss'],
})
export class CheckoutStepperComponent implements OnInit {
  currentStep = 1;
  steps = ['Cart Review', 'Shipping', 'Payment'];
  cart: Cart | null = null;
  isLoading = true;
  isSubmitting = false;

  shippingForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private razorpayService: RazorpayService
  ) {
    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    });
  }

  ngOnInit(): void {
    this.loadCart();
  }

  get userId(): string {
    return this.authService.currentUser?.id || 'guest-user';
  }

  get cartItems(): CartItem[] {
    return this.cart?.items || [];
  }

  get totalPrice(): number {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  private loadCart(): void {
    this.http.get<Cart>(`/api/cart/${this.userId}`).subscribe({
      next: (cart) => {
        this.cart = cart;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load cart.', 'error');
      },
    });
  }

  nextStep(): void {
    if (this.currentStep === 2 && this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  placeOrder(): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const orderPayload = {
      items: this.cartItems.map((item) => ({
        itemId: item.itemId,
        name: item.itemName,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: this.shippingForm.value,
      totalAmount: this.totalPrice,
    };

    // Step 1: Create order in backend
    this.http.post<{ id: string }>('/api/orders', orderPayload).subscribe({
      next: (orderResponse) => {
        // Step 2: Create Razorpay order
        this.processPayment(orderResponse.id);
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Order placement failed. Please try again.', 'error');
      },
    });
  }

  private processPayment(orderId: string): void {
    const user = this.authService.currentUser;

    this.razorpayService.createOrder(this.totalPrice, `receipt_${orderId}`).subscribe({
      next: async (razorpayOrder) => {
        try {
          // Demo mode: skip Razorpay modal, go straight to verification
          if (razorpayOrder.demo) {
            this.verifyPayment(
              {
                razorpay_payment_id: `pay_demo_${Date.now()}`,
                razorpay_order_id: razorpayOrder.id,
                razorpay_signature: 'demo_signature',
              },
              orderId
            );
            return;
          }

          // Production mode: Open Razorpay payment modal
          const paymentResult = await this.razorpayService.openPaymentModal({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            customerName: this.shippingForm.value.fullName,
            customerEmail: user?.email || '',
            customerPhone: this.shippingForm.value.phone,
            description: `Payment for Order #${orderId}`,
          });

          // Verify payment signature
          this.verifyPayment(paymentResult, orderId);
        } catch (err: any) {
          this.isSubmitting = false;
          if (err.message === 'Payment cancelled by user') {
            this.notificationService.show('Payment was cancelled.', 'warning');
          } else {
            this.notificationService.show(err.message || 'Payment failed. Please try again.', 'error');
          }
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Failed to initiate payment. Please try again.', 'error');
      },
    });
  }

  private verifyPayment(paymentResult: RazorpayPaymentResult, orderId: string): void {
    this.razorpayService.verifyPayment(paymentResult, orderId).subscribe({
      next: (verification) => {
        this.isSubmitting = false;
        if (verification.success) {
          this.notificationService.show('Payment successful!', 'success');
          this.router.navigate(['/checkout/confirmation'], {
            queryParams: { orderId },
          });
        } else {
          this.notificationService.show(verification.message || 'Payment verification failed.', 'error');
        }
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Payment verification failed. Please contact support.', 'error');
      },
    });
  }
}
