import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { DeliveryPartner, FulfilmentBooking as BookedEvent, FulfilmentQueueOrder } from '../../models';
import { FulfilmentCardComponent } from './fulfilment-card/fulfilment-card.component';

/**
 * Own-product ship queue (docs/commerce-architecture.md §5, §10.3). Lists paid orders
 * with FIRST_PARTY lines; shipping books only that group — the key is fixed server-side.
 */
@Component({
  selector: 'app-fulfilment',
  standalone: true,
  imports: [CommonModule, RouterModule, FulfilmentCardComponent],
  templateUrl: './fulfilment.component.html',
  styleUrls: ['./fulfilment.component.scss'],
})
export class FulfilmentComponent implements OnInit {
  tab: 'open' | 'shipped' = 'open';
  orders: FulfilmentQueueOrder[] = [];
  partners: DeliveryPartner[] = [];
  isLoading = true;
  loadError = '';

  /** Bookings made in this visit, newest first, so the result stays readable after the card leaves. */
  booked: BookedEvent[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<DeliveryPartner[]>('/api/delivery-partners?all=true').subscribe({
      next: (p) => (this.partners = p || []),
      // Without the list the card still works; it just cannot tell manual carriers apart.
      error: () => (this.partners = []),
    });
    this.load();
  }

  setTab(tab: 'open' | 'shipped'): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.orders = [];
    this.http.get<FulfilmentQueueOrder[]>(`/api/admin/fulfilment?state=${this.tab}`).subscribe({
      next: (list) => {
        this.orders = list || [];
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load the fulfilment queue.';
      },
    });
  }

  onBooked(event: BookedEvent): void {
    this.booked = [event, ...this.booked];
    if (this.tab === 'open') {
      this.orders = this.orders.filter((o) => o.orderId !== event.order.orderId);
    }
  }

  dismiss(event: BookedEvent): void {
    this.booked = this.booked.filter((b) => b !== event);
  }

  trackOrder(_: number, o: FulfilmentQueueOrder): number {
    return o.orderId;
  }
}
