import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

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
  steps = ['Cart Review', 'Shipping', 'Payment', 'Confirm'];
  cart: Cart | null = null;
  isLoading = true;
  isSubmitting = false;

  shippingForm: FormGroup;
  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
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

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardHolder: ['', [Validators.required]],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
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
    if (this.currentStep === 3 && this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    if (this.currentStep < 4) {
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

    this.http.post<{ id: string }>('/api/orders', orderPayload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.router.navigate(['/checkout/confirmation'], {
          queryParams: { orderId: response.id },
        });
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Order placement failed. Please try again.', 'error');
      },
    });
  }
}
