import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { AuthService } from './auth.service';

export interface CartItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

/**
 * Single source of truth for the current cart.
 *
 * The header previously hardcoded its badge to 0 because nothing tracked the cart
 * across components. Anything that mutates the cart should call refresh() so the
 * badge and any open cart view stay in step.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private cartSubject = new BehaviorSubject<Cart | null>(null);

  readonly cart$: Observable<Cart | null> = this.cartSubject.asObservable();

  /** Total units in the cart — what the header badge shows. */
  readonly itemCount$: Observable<number> = this.cart$.pipe(
    map((cart) => (cart?.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0))
  );

  readonly subtotal$: Observable<number> = this.cart$.pipe(
    map((cart) => (cart?.items || []).reduce((sum, i) => sum + i.price * i.quantity, 0))
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /** The BFF ignores this segment and uses the caller's token, but the route needs it. */
  get userId(): string {
    return this.authService.currentUser?.id || 'guest-user';
  }

  /** Re-reads the cart from the server and publishes it to every subscriber. */
  refresh(): void {
    this.load().subscribe();
  }

  load(): Observable<Cart | null> {
    return this.http.get<Cart>(`/api/cart/${this.userId}`).pipe(
      tap((cart) => this.cartSubject.next(cart)),
      catchError(() => {
        this.cartSubject.next(null);
        return of(null);
      })
    );
  }

  addItem(itemId: number, quantity = 1): Observable<unknown> {
    return this.http
      .post(`/api/cart/${this.userId}/items`, { itemId, quantity })
      .pipe(tap(() => this.refresh()));
  }

  updateQuantity(itemId: number, quantity: number): Observable<unknown> {
    return this.http
      .put(`/api/cart/${this.userId}/items/${itemId}`, { quantity })
      .pipe(tap(() => this.refresh()));
  }

  removeItem(itemId: number): Observable<unknown> {
    return this.http
      .delete(`/api/cart/${this.userId}/items/${itemId}`)
      .pipe(tap(() => this.refresh()));
  }

  clear(): Observable<unknown> {
    return this.http
      .delete(`/api/cart/${this.userId}/clear`)
      .pipe(tap(() => this.refresh()));
  }
}
