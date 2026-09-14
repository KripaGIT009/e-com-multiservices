import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';
import {
  CourierOption,
  CourierQuote,
  SellerOrder,
  SellerPortalService,
  SellerShipment,
} from '../seller.service';

type QuoteLoad =
  | { state: 'loading' }
  | { state: 'ready'; quote: CourierQuote }
  | { state: 'error'; message: string };

/** Statuses after which nothing is left for a seller to do, shipment or not. */
const TERMINAL = ['CANCELLED', 'REFUNDED'];
/** An order only reaches these when every group has shipped (§4.1), so this seller's has. */
const PAST_SHIPPING = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

@Component({
  selector: 'app-seller-orders',
  templateUrl: './seller-orders.component.html',
  styleUrls: ['./seller-orders.component.scss'],
})
export class SellerOrdersComponent implements OnInit {
  orders: SellerOrder[] = [];
  isLoading = true;

  filter: 'all' | 'open' | 'shipped' = 'all';
  expanded: number | null = null;

  /** Courier chosen per order, keyed by order id. */
  chosenPartner: Record<number, string> = {};
  /** Optional tracking number the seller got by booking the courier themselves. */
  trackingInput: Record<number, string> = {};

  /** The allocation suggestion (no manual pick) — its candidates fill the courier list. */
  suggestion: Record<number, QuoteLoad> = {};
  /** Result of re-quoting a manual pick; present only while that pick differs from the suggestion. */
  override: Record<number, QuoteLoad> = {};

  shipping: number | null = null;
  shipError: Record<number, string> = {};
  /** Booking just made on this page, so the confirmation stays visible in the card. */
  justShipped: Record<number, SellerShipment> = {};

  /** Guards against a slow re-quote overwriting a newer choice. */
  private overrideSeq: Record<number, number> = {};

  constructor(
    private seller: SellerPortalService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.seller.orders().subscribe({
      next: (o) => { this.orders = o || []; this.isLoading = false; },
      error: () => { this.isLoading = false; this.notify.show('Could not load your orders.', 'error'); },
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

  /**
   * Open for THIS seller: their group has no shipment and the order is still live. A
   * multi-seller order can be closed here while other sellers still have work on it.
   */
  isOpen(o: SellerOrder): boolean {
    if (o.shipment) return false;
    const s = String(o.status || '').toUpperCase();
    return !TERMINAL.includes(s) && !PAST_SHIPPING.includes(s);
  }

  /**
   * Placed but not paid. Still the seller's to see, but not to ship — the server
   * refuses to book a courier for an unpaid order, so the UI does not offer it.
   */
  awaitingPayment(o: SellerOrder): boolean {
    return String(o.status || '').toUpperCase() === 'PENDING';
  }

  statusClass(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'DELIVERED') return 'is-delivered';
    if (s === 'SHIPPED' || s === 'OUT_FOR_DELIVERY') return 'is-shipped';
    if (s === 'CANCELLED' || s === 'REFUNDED') return 'is-cancelled';
    if (['PAYMENT_COMPLETED', 'INVENTORY_RESERVED', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(s)) {
      return 'is-confirmed';
    }
    return 'is-pending';
  }

  statusLabel(status: string): string {
    const s = String(status || '').toUpperCase();
    if (s === 'PAYMENT_COMPLETED') return 'PAID';
    return s.replace(/_/g, ' ');
  }

  unitsFor(o: SellerOrder): number {
    return o.items.reduce((s, i) => s + (i.quantity || 0), 0);
  }

  toggle(o: SellerOrder): void {
    this.expanded = this.expanded === o.id ? null : o.id;
    if (this.expanded && this.isOpen(o) && !this.awaitingPayment(o)) {
      const current = this.suggestion[o.id];
      if (!current || current.state === 'error') this.loadSuggestion(o);
    }
  }

  loadSuggestion(o: SellerOrder): void {
    this.suggestion[o.id] = { state: 'loading' };
    this.seller.courierQuote(o.id).subscribe({
      next: (quote) => {
        const q: CourierQuote = { ...quote, candidates: quote?.candidates || [] };
        this.suggestion[o.id] = { state: 'ready', quote: q };
        delete this.override[o.id];
        this.chosenPartner[o.id] = q.selected?.code || '';
      },
      error: (err: HttpErrorResponse) => {
        this.suggestion[o.id] = {
          state: 'error',
          message: err.error?.error || 'Could not get a courier suggestion for this order.',
        };
      },
    });
  }

  /** Courier options: couriers that serve the customer's pincode, per allocation. */
  candidatesFor(o: SellerOrder): CourierOption[] {
    const s = this.suggestion[o.id];
    return s?.state === 'ready' ? s.quote.candidates : [];
  }

  suggestedQuote(o: SellerOrder): CourierQuote | null {
    const s = this.suggestion[o.id];
    return s?.state === 'ready' ? s.quote : null;
  }

  onPartnerChange(o: SellerOrder, code: string): void {
    this.chosenPartner[o.id] = code;
    delete this.shipError[o.id];
    const suggested = this.suggestedQuote(o)?.selected?.code || '';
    if (!code || code === suggested) {
      delete this.override[o.id];
      return;
    }
    const seq = (this.overrideSeq[o.id] || 0) + 1;
    this.overrideSeq[o.id] = seq;
    this.override[o.id] = { state: 'loading' };
    this.seller.courierQuote(o.id, code).subscribe({
      next: (quote) => {
        if (this.overrideSeq[o.id] !== seq) return;
        this.override[o.id] = { state: 'ready', quote: { ...quote, candidates: quote?.candidates || [] } };
      },
      error: (err: HttpErrorResponse) => {
        if (this.overrideSeq[o.id] !== seq) return;
        this.override[o.id] = {
          state: 'error',
          message: err.error?.error || 'Could not check that courier for this order.',
        };
      },
    });
  }

  /** The server's reason for refusing the current manual pick, if it refused. */
  overrideRejection(o: SellerOrder): string | null {
    const r = this.override[o.id];
    return r?.state === 'ready' ? r.quote.manualOverrideRejected || null : null;
  }

  canShip(o: SellerOrder): boolean {
    if (this.shipping !== null) return false;
    const s = this.suggestion[o.id];
    if (!s || s.state === 'loading') return false;
    // Allocation found no courier for this pincode: nothing can be booked.
    if (s.state === 'ready' && !s.quote.selected && s.quote.candidates.length === 0) return false;
    const r = this.override[o.id];
    if (r?.state === 'loading') return false;
    if (this.overrideRejection(o)) return false;
    return true;
  }

  reasonLabel(reason: string | null | undefined): string {
    switch (String(reason || '').toUpperCase()) {
      case 'RULE': return 'Location rule';
      case 'DEFAULT': return 'Default courier';
      case 'STRATEGY': return 'Best available';
      case 'MANUAL': return 'Manual choice';
      case 'NONE': return 'No courier';
      default: return String(reason || '');
    }
  }

  /** "Suggested: Blue Dart — rule South metros matched…", without repeating the name. */
  suggestionText(q: CourierQuote): string {
    if (!q.selected) return q.explanation || 'No courier currently serves this delivery pincode.';
    const name = q.selected.name;
    let why = (q.explanation || '').trim();
    if (why.toLowerCase().startsWith(`${name.toLowerCase()}:`)) why = why.slice(name.length + 1).trim();
    return why ? `Suggested: ${name} — ${why}` : `Suggested: ${name}`;
  }

  humanise(value: string | null | undefined): string {
    const s = String(value || '').replace(/_/g, ' ').toLowerCase();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  }

  ship(o: SellerOrder): void {
    if (!this.canShip(o)) return;
    this.shipping = o.id;
    delete this.shipError[o.id];

    const partnerCode = this.chosenPartner[o.id] || null;
    const trackingNumber = (this.trackingInput[o.id] || '').trim() || null;

    this.seller.shipOrder(o.id, { partnerCode, trackingNumber }).subscribe({
      next: (s) => {
        this.shipping = null;
        this.justShipped[o.id] = s;
        o.shipment = s;
        const tracking = s.trackingNumber ? ` Tracking ${s.trackingNumber}.` : '';
        this.notify.show(`Shipment booked with ${s.carrier || s.partnerCode || 'the courier'}.${tracking}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.shipping = null;
        const message = err.error?.error || 'Could not create the shipment.';
        this.shipError[o.id] = message;
        if (err.status !== 422) this.notify.show(message, 'error');
      },
    });
  }
}
