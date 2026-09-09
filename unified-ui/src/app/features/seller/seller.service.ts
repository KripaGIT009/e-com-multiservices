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
