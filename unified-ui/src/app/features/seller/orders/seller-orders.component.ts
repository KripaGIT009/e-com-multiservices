import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';

interface SellerOrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sellerName?: string;
}

interface SellerOrder {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddressLine?: string;
  deliveryPartnerName?: string;
  deliveryPartnerCode?: string;
  expectedDelivery?: string;
  items: SellerOrderLine[];
  sellerSubtotal: number;
}

interface DeliveryPartner {
  id: number;
  code: string;
  name: string;
  estimatedDays: number;
  collectsFromYou?: boolean;
}

@Component({
  selector: 'app-seller-orders',
  templateUrl: './seller-orders.component.html',
  styleUrls: ['./seller-orders.component.scss'],
})
export class SellerOrdersComponent implements OnInit {
  orders: SellerOrder[] = [];
  partners: DeliveryPartner[] = [];
  isLoading = true;

  filter: 'all' | 'open' | 'shipped' = 'all';
  expanded: number | null = null;
  /** Courier chosen per order in the ship dialog, keyed by order id. */
  chosenPartner: Record<number, string> = {};
  shipping: number | null = null;

  private readonly OPEN = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'];

  constructor(
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.http.get<SellerOrder[]>('/api/seller/orders').subscribe({
      next: (o) => { this.orders = o; this.isLoading = false; },
      error: () => { this.isLoading = false; this.notify.show('Could not load your orders.', 'error'); },
    });
    this.http.get<{ partners: DeliveryPartner[] }>('/api/seller/delivery-partners').subscribe({
      next: (r) => { this.partners = r.partners.filter((p) => p.collectsFromYou); },
      error: () => { /* the ship dialog falls back to the order's assigned courier */ },
    });
  }

  get visible(): SellerOrder[] {
    if (this.filter === 'open') return this.orders.filter((o) => this.isOpen(o));
    if (this.filter === 'shipped') return this.orders.filter((o) => !this.isOpen(o));
    return this.orders;
  }

  get openCount(): number {
    return this.orders.filter((o) => this.isOpen(o)).length;
  }

  isOpen(o: SellerOrder): boolean {
    return this.OPEN.includes(String(o.status || '').toUpperCase());
  }

  statusClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') return 'is-delivered';
    if (s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY') return 'is-shipped';
    if (s === 'CANCELLED') return 'is-cancelled';
    if (s === 'CONFIRMED' || s === 'PROCESSING' || s === 'PACKED') return 'is-confirmed';
    return 'is-pending';
  }

  unitsFor(o: SellerOrder): number {
    return o.items.reduce((s, i) => s + (i.quantity || 0), 0);
  }

  toggle(o: SellerOrder): void {
    this.expanded = this.expanded === o.id ? null : o.id;
    if (this.expanded && !this.chosenPartner[o.id]) {
      // Default to whatever was assigned at checkout.
      this.chosenPartner[o.id] = o.deliveryPartnerCode || this.partners[0]?.code || '';
    }
  }

  ship(o: SellerOrder): void {
    if (this.shipping) return;
    this.shipping = o.id;
    this.http
      .post<{ trackingNumber: string; carrier: string }>(
        `/api/seller/orders/${o.id}/ship`,
        { partnerCode: this.chosenPartner[o.id] || o.deliveryPartnerCode }
      )
      .subscribe({
        next: (s) => {
          this.shipping = null;
          this.notify.show(
            `Shipment created with ${s.carrier}. Tracking ${s.trackingNumber}.`,
            'success'
          );
          o.status = 'SHIPPED';
        },
        error: (err: HttpErrorResponse) => {
          this.shipping = null;
          this.notify.show(err.error?.error || 'Could not create the shipment.', 'error');
        },
      });
  }
}
