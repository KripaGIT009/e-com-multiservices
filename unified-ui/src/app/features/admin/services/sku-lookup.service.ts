import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  ProductLookupResult,
  ProductDetails,
  CreateProductRequest,
} from '../models';

/**
 * Service for SKU-based product lookup, product creation, and stock updates.
 * Calls BFF proxy endpoints: GET /api/items/sku/:sku, POST /api/items, POST /api/inventory.
 * Requirements: 2.1, 2.2, 2.4, 2.5, 3.2, 4.3
 */
@Injectable({ providedIn: 'root' })
export class SkuLookupService {
  constructor(private http: HttpClient) {}

  /**
   * Look up a product by its SKU.
   * Maps 404 to { found: false }, network/server errors to { found: false, error: message }.
   */
  lookupBySku(sku: string): Observable<ProductLookupResult> {
    return this.http.get<ProductDetails>(`/api/items/sku/${encodeURIComponent(sku)}`).pipe(
      map((product) => ({ found: true, product })),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of({ found: false } as ProductLookupResult);
        }
        const message = error.status === 0
          ? 'Network error. Please check your connection and try again.'
          : `Server error (${error.status}). Please try again.`;
        return of({ found: false, error: message } as ProductLookupResult);
      })
    );
  }

  /**
   * Create a new product.
   * Maps 409 to a duplicate SKU error, other errors to descriptive messages.
   */
  createProduct(product: CreateProductRequest): Observable<ProductDetails> {
    return this.http.post<ProductDetails>('/api/items', product).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 409) {
          return throwError(() => new Error('SKU already exists. Would you like to look it up?'));
        }
        const message = error.status === 0
          ? 'Network error. Please check your connection and try again.'
          : `Failed to create product (${error.status}). Please try again.`;
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Update stock level for a product.
   * Posts to inventory endpoint with the new quantity.
   */
  updateStock(itemId: number, sku: string, quantity: number): Observable<void> {
    return this.http.post<void>('/api/inventory', {
      itemId,
      sku,
      availableQuantity: quantity,
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        const message = error.status === 0
          ? 'Network error. Please check your connection and try again.'
          : `Failed to update stock (${error.status}). Please try again.`;
        return throwError(() => new Error(message));
      })
    );
  }
}
