import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RazorpayService, RazorpayPaymentResult } from '../../../core/services/razorpay.service';
import { CartService } from '../../../core/services/cart.service';

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

/** One fulfilment group of the cart, from `POST /api/delivery/quote` (§10.1). */
export interface DeliveryQuoteGroup {
  fulfilmentKey: string;
  label: string;
  /** Null for dropship groups (the partner ships) and when no courier serves the pincode. */
  courier: string | { code?: string; name: string; estimatedDays?: number | null } | null;
  estimatedDays: number | null;
  reason: 'MANUAL' | 'RULE' | 'DEFAULT' | 'STRATEGY' | 'NONE' | string | null;
}

export interface DeliveryQuoteResponse {
  groups: DeliveryQuoteGroup[];
}

type QuoteState = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-checkout-stepper',
  templateUrl: './checkout-stepper.component.html',
  styleUrls: ['./checkout-stepper.component.scss'],
})
export class CheckoutStepperComponent implements OnInit, OnDestroy {
  currentStep = 1;
  steps = ['Cart Review', 'Shipping', 'Payment'];
  cart: Cart | null = null;
  isLoading = true;
  isSubmitting = false;

  shippingForm: FormGroup;

  /** Delivery estimate per fulfilment group. Hidden entirely when the quote fails. */
  quoteGroups: DeliveryQuoteGroup[] = [];
  quoteState: QuoteState = 'idle';
  private readonly quoteRequests = new Subject<{ pincode: string; state: string }>();
  private lastQuoteKey: string | null = null;
  private readonly subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private razorpayService: RazorpayService,
    private cartService: CartService
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

    // One in-flight quote at a time; a newer address cancels the older request.
    this.subs.add(
      this.quoteRequests
        .pipe(
          tap(() => { this.quoteState = 'loading'; this.quoteGroups = []; }),
          switchMap((body) =>
            this.http.post<DeliveryQuoteResponse>('/api/delivery/quote', body).pipe(
              map((r) => ({ ok: true as const, groups: r?.groups || [] })),
              catchError(() => of({ ok: false as const, groups: [] as DeliveryQuoteGroup[] }))
            )
          )
        )
        .subscribe((r) => {
          this.quoteGroups = r.groups;
          this.quoteState = r.ok ? 'ready' : 'error';
        })
    );

    // Re-quote when the pincode or state changes, once the address is usable.
    this.subs.add(
      this.shippingForm.valueChanges
        .pipe(debounceTime(400))
        .subscribe(() => {
          if (this.currentStep === 3) this.requestQuote();
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** Asks for a delivery estimate for the current address, if the pincode is valid. */
  private requestQuote(): void {
    const pincodeCtrl = this.shippingForm.get('postalCode');
    const pincode = String(pincodeCtrl?.value || '').trim();
    const state = String(this.shippingForm.get('state')?.value || '').trim();
    if (!pincodeCtrl?.valid || !/^\d{6}$/.test(pincode)) {
      this.lastQuoteKey = null;
      this.quoteState = 'idle';
      this.quoteGroups = [];
      return;
    }
    const key = `${pincode}|${state.toLowerCase()}`;
    // Same address already quoted (or being quoted): nothing to do. A failed quote retries.
    if (key === this.lastQuoteKey && (this.quoteState === 'ready' || this.quoteState === 'loading')) {
      return;
    }
    this.lastQuoteKey = key;
    this.quoteRequests.next({ pincode, state });
  }

  isDropshipGroup(g: DeliveryQuoteGroup): boolean {
    return String(g.fulfilmentKey || '').toUpperCase().startsWith('DROPSHIP');
  }

  courierName(g: DeliveryQuoteGroup): string | null {
    if (!g.courier) return null;
    return typeof g.courier === 'string' ? g.courier : g.courier.name || null;
  }

  estimatedDaysFor(g: DeliveryQuoteGroup): number | null {
    if (g.estimatedDays != null) return g.estimatedDays;
    if (g.courier && typeof g.courier === 'object' && g.courier.estimatedDays != null) {
      return g.courier.estimatedDays;
    }
    return null;
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
    if (this.currentStep === 3) {
      this.requestQuote();
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

    // Only the order id goes to the server; it charges the order's stored total.
    // `totalPrice` is for display on this page and nothing else.
    this.razorpayService.createOrder(orderId).subscribe({
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
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        if (err.status === 409) {
          this.notificationService.show(
            'This order has already been paid, so it cannot be paid again. Check My Orders for its status.',
            'warning'
          );
        } else if (err.status === 404) {
          this.notificationService.show('We could not find that order on your account.', 'error');
        } else {
          this.notificationService.show(
            err.error?.error || 'Failed to initiate payment. Please try again.',
            'error'
          );
        }
      },
    });
  }

  private verifyPayment(paymentResult: RazorpayPaymentResult, orderId: string): void {
    this.razorpayService.verifyPayment(paymentResult, orderId).subscribe({
      next: (verification) => {
        this.isSubmitting = false;
        if (verification.success) {
          this.notificationService.show('Payment successful!', 'success');
          // The cart used to still hold everything the customer had just bought.
          this.http.delete(`/api/cart/${this.userId}/clear`).subscribe({
            complete: () => this.cartService.refresh(),
            error: () => this.cartService.refresh(),
          });
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
