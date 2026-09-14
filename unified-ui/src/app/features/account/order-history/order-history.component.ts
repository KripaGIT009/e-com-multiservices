import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
}

/** Shipment fields the customer view of `/api/orders/:id/fulfilment` may carry. */
interface FulfilmentShipment {
  carrier?: string | null;
  partnerCode?: string | null;
  trackingNumber?: string | null;
  carrierTrackingUrl?: string | null;
  trackingGenerated?: boolean | null;
  status?: string | null;
  estimatedDelivery?: string | null;
}

/** Customer view of a dropship supplier order: no cost, no partner reference. */
interface FulfilmentSupplierOrder {
  status?: string | null;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}

interface FulfilmentGroup {
  fulfilmentKey: string;
  model: 'FIRST_PARTY' | 'SELLER' | 'DROPSHIP' | string;
  label: string;
  lines: { productName?: string; quantity?: number }[];
  shipped: boolean;
  shipment?: FulfilmentShipment | null;
  supplierOrder?: FulfilmentSupplierOrder | null;
}

interface OrderFulfilment {
  orderId: string | number;
  orderStatus: string;
  allShipped: boolean;
  groups: FulfilmentGroup[];
}

/** What the template shows for one group, whichever record the tracking came from. */
interface GroupTracking {
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  trackingGenerated: boolean;
}

type FulfilmentLoad =
  | { state: 'loading' }
  | { state: 'ready'; data: OrderFulfilment }
  | { state: 'error' };

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;

  /** Order whose delivery progress is open. */
  expanded: string | null = null;
  /** Fetched lazily on first expand, then kept for the life of the page. */
  fulfilment: Record<string, FulfilmentLoad> = {};

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.http.get<Order[]>('/api/orders').subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load orders.', 'error');
      },
    });
  }

  toggle(order: Order): void {
    const id = String(order.id);
    this.expanded = this.expanded === id ? null : id;
    if (this.expanded && this.fulfilment[id]?.state !== 'ready' && this.fulfilment[id]?.state !== 'loading') {
      this.loadFulfilment(id);
    }
  }

  loadFulfilment(id: string): void {
    this.fulfilment[id] = { state: 'loading' };
    this.http.get<OrderFulfilment>(`/api/orders/${encodeURIComponent(id)}/fulfilment`).subscribe({
      next: (data) => { this.fulfilment[id] = { state: 'ready', data: { ...data, groups: data?.groups || [] } }; },
      error: () => { this.fulfilment[id] = { state: 'error' }; },
    });
  }

  tracking(g: FulfilmentGroup): GroupTracking {
    const s = g.shipment;
    const so = g.supplierOrder;
    return {
      carrier: s?.carrier || so?.carrierName || null,
      trackingNumber: s?.trackingNumber || so?.trackingNumber || null,
      trackingUrl: s?.carrierTrackingUrl || so?.trackingUrl || null,
      trackingGenerated: s?.trackingGenerated === true,
    };
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'COMPLETED':
        return 'badge-success';
      case 'PENDING':
      case 'PROCESSING':
        return 'badge-warning';
      case 'CANCELLED':
      case 'FAILED':
        return 'badge-error';
      default:
        return 'badge-default';
    }
  }
}
