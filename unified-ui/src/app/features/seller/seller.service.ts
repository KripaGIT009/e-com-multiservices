import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

export interface Seller {
  id: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  gstin?: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupPostalCode?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  statusReason?: string;
  createdAt: string;
}

export interface SellerProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  itemType?: string;
  sellerId?: number;
  sellerName?: string;
}

// ── Orders and courier allocation (commerce-architecture §6, §10.2) ──────────

export type AllocationReason = 'MANUAL' | 'RULE' | 'DEFAULT' | 'STRATEGY' | 'NONE';

export interface CourierOption {
  code: string;
  name: string;
  estimatedDays?: number | null;
  baseRate?: number | null;
  trackingUrlTemplate?: string | null;
  integrationType?: string | null;
}

/** `GET /api/seller/orders/:orderId/courier-quote?partnerCode=` */
export interface CourierQuote {
  selected: CourierOption | null;
  reason: AllocationReason | string;
  ruleId?: number | null;
  ruleName?: string | null;
  explanation?: string | null;
  /** Why a manual pick could not be honoured, e.g. "DTDC does not serve 794001". */
  manualOverrideRejected?: string | null;
  candidates: CourierOption[];
}

/** This seller's group shipment, as returned on orders and by the ship call. */
export interface SellerShipment {
  id?: number;
  orderId?: string;
  fulfilmentKey?: string | null;
  partnerCode?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  carrierTrackingUrl?: string | null;
  status?: string | null;
  estimatedDelivery?: string | null;
  bookingMode?: string | null;
  trackingGenerated?: boolean | null;
  labelUrl?: string | null;
  bookingNote?: string | null;
  alreadyBooked?: boolean | null;
}

export interface SellerOrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  sellerName?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_COMPLETED'
  | 'INVENTORY_RESERVED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | string;

export interface SellerOrder {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddressLine?: string;
  deliveryPartnerName?: string;
  deliveryPartnerCode?: string;
  expectedDelivery?: string;
  items: SellerOrderLine[];
  sellerSubtotal: number;
  /** `SELLER:{id}` — this seller's group. */
  fulfilmentKey?: string | null;
  /** This seller's group shipment only; absent until they ship. */
  shipment?: SellerShipment | null;
}

/**
 * Sellers authenticate against seller-service but hold a token signed by the BFF, so
 * the browser stores one token in one place regardless of realm (see ADR-0004). That
 * means the existing AuthService, JWT interceptor and route guards all apply.
 */
@Injectable({ providedIn: 'root' })
export class SellerPortalService {
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  register(payload: Record<string, unknown>): Observable<{ token: string; seller: Seller }> {
    return this.http
      .post<{ token: string; seller: Seller }>('/api/seller/register', payload)
      .pipe(tap((r) => this.storeSession(r)));
  }

  login(email: string, password: string): Observable<{ token: string; seller: Seller }> {
    return this.http
      .post<{ token: string; seller: Seller }>('/api/seller/login', { email, password })
      .pipe(tap((r) => this.storeSession(r)));
  }

  me(): Observable<Seller> {
    return this.http.get<Seller>('/api/seller/me');
  }

  updateProfile(payload: Record<string, unknown>): Observable<Seller> {
    return this.http.put<Seller>('/api/seller/me', payload);
  }

  products(): Observable<SellerProduct[]> {
    return this.http.get<SellerProduct[]>('/api/seller/products');
  }

  addProduct(p: Partial<SellerProduct>): Observable<SellerProduct> {
    return this.http.post<SellerProduct>('/api/seller/products', p);
  }

  updateProduct(id: number, p: Partial<SellerProduct>): Observable<SellerProduct> {
    return this.http.put<SellerProduct>(`/api/seller/products/${id}`, p);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`/api/seller/products/${id}`);
  }

  orders(): Observable<SellerOrder[]> {
    return this.http.get<SellerOrder[]>('/api/seller/orders');
  }

  /** Allocation for this seller's group; `partnerCode` asks whether a manual pick is allowed. */
  courierQuote(orderId: number, partnerCode?: string | null): Observable<CourierQuote> {
    const q = partnerCode ? `?partnerCode=${encodeURIComponent(partnerCode)}` : '';
    return this.http.get<CourierQuote>(`/api/seller/orders/${orderId}/courier-quote${q}`);
  }

  /** Books this seller's group. 422 when the courier pick is rejected. */
  shipOrder(
    orderId: number,
    body: { partnerCode?: string | null; trackingNumber?: string | null }
  ): Observable<SellerShipment> {
    return this.http.post<SellerShipment>(`/api/seller/orders/${orderId}/ship`, body);
  }

  /** Reuses the customer session store so the interceptor and guards just work. */
  private storeSession(r: { token: string; seller: Seller }): void {
    this.authService.adoptSession(r.token, {
      id: String(r.seller.id),
      username: r.seller.businessName,
      email: r.seller.email,
      role: 'SELLER',
    });
  }
}
