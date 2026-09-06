import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  demo?: boolean;
}

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  message?: string;
}

declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  constructor(private http: HttpClient) {}

  createOrder(amount: number, receipt: string): Observable<RazorpayOrder> {
    return this.http.post<RazorpayOrder>('/api/payments/razorpay/create-order', { amount, receipt });
  }

  verifyPayment(paymentResult: RazorpayPaymentResult, orderId: string): Observable<PaymentVerificationResponse> {
    return this.http.post<PaymentVerificationResponse>('/api/payments/razorpay/verify', {
      ...paymentResult,
      orderId
    });
  }

  async openPaymentModal(options: {
    orderId: string;
    amount: number;
    currency?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    description?: string;
  }): Promise<RazorpayPaymentResult> {
    // Fetch Razorpay key from backend
    const keyResponse = await firstValueFrom(
      this.http.get<{ key: string }>('/api/payments/razorpay/key')
    );

    return new Promise((resolve, reject) => {
      const razorpayOptions = {
        key: keyResponse.key,
        amount: options.amount, // Already in paise from create-order response
        currency: options.currency || 'INR',
        name: 'MyIndianStore',
        description: options.description || 'Order Payment',
        order_id: options.orderId,
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone || '',
        },
        theme: {
          color: '#FF6B35',
        },
        handler: (response: RazorpayPaymentResult) => {
          resolve(response);
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
        },
      };

      const rzp = new Razorpay(razorpayOptions);
      rzp.on('payment.failed', (response: any) => {
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  }
}
