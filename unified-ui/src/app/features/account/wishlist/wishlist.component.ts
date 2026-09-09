import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { NotificationService } from '../../../core/services/notification.service';
import { CartService } from '../../../core/services/cart.service';
import { productPlaceholder } from '../../../core/utils/product-image';

interface WishlistEntry {
  id: number;
  itemId: number;
  itemName: string;
  priceAtSave: number | null;
  createdAt: string;
  /** Live catalogue record, or null if the product has since been withdrawn. */
  item: { id: number; name: string; price: number; description?: string } | null;
  currentPrice: number | null;
  priceDropped: boolean;
  available: boolean;
}

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
})
export class WishlistComponent implements OnInit {
  entries: WishlistEntry[] = [];
  isLoading = true;
  /** Item ids with an action in flight, so their buttons can disable individually. */
  busy = new Set<number>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cartService: CartService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  imageFor(entry: WishlistEntry): string {
    return productPlaceholder(entry.itemName, entry.itemId);
  }

  /** How much cheaper the item is now than when it was saved. */
  savingOn(entry: WishlistEntry): number | null {
    if (!entry.priceDropped || entry.priceAtSave == null || entry.currentPrice == null) return null;
    return entry.priceAtSave - entry.currentPrice;
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<WishlistEntry[]>('/api/wishlist').subscribe({
      next: (entries) => {
        this.entries = entries;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Could not load your wish list.', 'error');
      },
    });
  }

  viewProduct(entry: WishlistEntry): void {
    if (!entry.available) return;
    this.router.navigate(['/storefront/products', entry.itemId]);
  }

  moveToCart(entry: WishlistEntry, event: Event): void {
    event.stopPropagation();
    if (this.busy.has(entry.itemId)) return;
    this.busy.add(entry.itemId);

    this.http.post(`/api/wishlist/items/${entry.itemId}/move-to-cart`, {}).subscribe({
      next: () => {
        this.busy.delete(entry.itemId);
        this.entries = this.entries.filter((e) => e.itemId !== entry.itemId);
        this.cartService.refresh();
        this.notificationService.show(`${entry.itemName} moved to your cart.`, 'success');
      },
      error: () => {
        this.busy.delete(entry.itemId);
        this.notificationService.show('Could not move that item to your cart.', 'error');
      },
    });
  }

  remove(entry: WishlistEntry, event: Event): void {
    event.stopPropagation();
    if (this.busy.has(entry.itemId)) return;
    this.busy.add(entry.itemId);

    this.http.delete(`/api/wishlist/items/${entry.itemId}`).subscribe({
      next: () => {
        this.busy.delete(entry.itemId);
        this.entries = this.entries.filter((e) => e.itemId !== entry.itemId);
        this.notificationService.show('Removed from your wish list.', 'success');
      },
      error: () => {
        this.busy.delete(entry.itemId);
        this.notificationService.show('Could not remove that item.', 'error');
      },
    });
  }

  browse(): void {
    this.router.navigate(['/storefront/products']);
  }
}
