import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, BehaviorSubject, interval } from 'rxjs';
import { mergeMap, map, catchError, tap, switchMap, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'http://localhost:8006/carts';
  private cartUpdated = new Subject<void>();
  private cartCountSubject = new BehaviorSubject<number>(0);
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Emit cart updates when changed
    this.cartUpdated.pipe(
      tap(() => this.refreshCartCount())
    ).subscribe();
    // Initialize cart count on service creation (only in browser) with a slight delay
    if (this.isBrowser) {
      setTimeout(() => this.refreshCartCount(), 100);
    }
  }

  // Public method to manually trigger cart count refresh
  public refreshCart(): void {
    this.refreshCartCount();
  }

  private refreshCartCount(): void {
    if (!this.isBrowser) {
      this.cartCountSubject.next(0);
      return;
    }
    const userId = localStorage.getItem('userId') || 'guest';
    console.log('Refreshing cart count for userId:', userId);
    this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(response => console.log('Cart API response:', response)),
      map((cart: any) => {
        const count = cart?.itemCount || 0;
        console.log('Extracted item count:', count, 'from cart:', cart);
        return count;
      }),
      distinctUntilChanged(),
      tap(count => {
        console.log('Setting cart count subject to:', count);
        this.cartCountSubject.next(count);
        console.log('Cart count refreshed:', count);
      }),
      catchError((error) => {
        console.error('Error refreshing cart count:', error);
        console.error('Using userId:', userId);
        return of(0);
      })
    ).subscribe();
  }

  getCart(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      mergeMap((cart: any) => 
        this.http.get<any>(`${this.apiUrl}/${cart.id}/items`).pipe(
          map((items: any[]) => ({
            ...cart,
            items: items || []
          }))
        )
      ),
      catchError((error) => {
        console.error('Error fetching cart:', error);
        return of({ items: [] });
      })
    );
  }

  addToCart(userId: string, itemId: string, quantity: number, itemName?: string, price?: number): Observable<any> {
    // First get the cart by userId, then add item
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      mergeMap((cart: any) => 
        this.http.post<any>(`${this.apiUrl}/${cart.id}/items`, {
          itemId: typeof itemId === 'string' ? parseInt(itemId, 10) : itemId,
          itemName: itemName || `Item ${itemId}`,
          quantity,
          price: price || 0
        }).pipe(
          tap(() => this.cartUpdated.next())
        )
      )
    );
  }

  removeFromCart(userId: string, itemId: string): Observable<any> {
    // First get the cart by userId, then remove item
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      mergeMap((cart: any) => 
        this.http.delete<any>(`${this.apiUrl}/${cart.id}/items/${itemId}`).pipe(
          tap(() => this.cartUpdated.next())
        )
      )
    );
  }

  updateItemQuantity(userId: string, cartItemId: string, newQuantity: number): Observable<any> {
    // First get the cart by userId, then update item quantity
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      mergeMap((cart: any) => 
        this.http.put<any>(`${this.apiUrl}/${cart.id}/items/${cartItemId}`, { quantity: newQuantity }).pipe(
          tap(() => this.cartUpdated.next())
        )
      )
    );
  }

  clearCart(userId: string): Observable<any> {
    // First get the cart by userId, then clear it
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      mergeMap((cart: any) => 
        this.http.delete<any>(`${this.apiUrl}/${cart.id}/clear`).pipe(
          tap(() => this.cartUpdated.next())
        )
      )
    );
  }

  getCartCount(): Observable<number> {
    // Return cart count from BehaviorSubject (cached and emits immediately)
    return this.cartCountSubject.asObservable();
  }

  onCartUpdated(): Observable<void> {
    return this.cartUpdated.asObservable();
  }
}
