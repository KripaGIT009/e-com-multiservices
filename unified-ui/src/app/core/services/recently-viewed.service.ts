import { Injectable } from '@angular/core';

export interface ViewedProduct {
  id: number;
  name: string;
  price: number;
  viewedAt: number;
}

const KEY = 'mis_recently_viewed';
const LIMIT = 20;

/**
 * Backs the "Keep shopping for" menu entry.
 *
 * Deliberately client-side. A server-side browse history belongs to
 * recommendation-service, which does not exist yet — but the useful half of the
 * feature (show me what I was just looking at) needs no backend, so it ships now
 * rather than waiting behind a service. It is per-browser and never leaves the device.
 *
 * Every read and write is guarded: localStorage throws in private windows and when a
 * browser is set to block site data.
 */
@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {

  list(): ViewedProduct[] {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /** Records a view, moving an already-seen product back to the front. */
  record(product: { id: number; name: string; price: number }): void {
    if (!product?.id) return;
    try {
      const next = [
        { id: product.id, name: product.name, price: product.price, viewedAt: Date.now() },
        ...this.list().filter((p) => p.id !== product.id),
      ].slice(0, LIMIT);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — the feature degrades to empty rather than breaking.
    }
  }

  remove(id: number): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.list().filter((p) => p.id !== id)));
    } catch { /* ignore */ }
  }

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }
}
