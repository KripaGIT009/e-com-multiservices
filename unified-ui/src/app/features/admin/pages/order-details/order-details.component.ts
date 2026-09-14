import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { BreadcrumbComponent, BreadcrumbSegment } from '../../components/breadcrumb/breadcrumb.component';
import { AllocationReasonComponent } from '../../components/allocation-reason/allocation-reason.component';
import {
  addressText,
  AdminOrderView,
  FulfilmentGroup,
  OrderFulfilmentView,
} from '../../models';

/**
 * One order, shown as the fulfilment groups it actually ships in
 * (docs/commerce-architecture.md §4.1): own products, each seller, each dropship partner.
 * Everything here comes from the order snapshot and its shipments — nothing is invented.
 */
@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, BreadcrumbComponent, AllocationReasonComponent],
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
})
export class OrderDetailsComponent implements OnInit {
  orderId = '';
  breadcrumbSegments: BreadcrumbSegment[] = [];

  order: AdminOrderView | null = null;
  fulfilment: OrderFulfilmentView | null = null;
  /** Set when the order loaded but its fulfilment view did not. */
  fulfilmentError = '';

  isLoading = true;
  notFound = false;
  error = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.breadcrumbSegments = [
      { label: 'Dashboard', routerLink: '/admin' },
      { label: 'Active Orders', routerLink: '/admin/orders/active' },
      { label: `Order ${this.orderId}` },
    ];
    this.load();
  }

  load(): void {
    if (!this.orderId) {
      this.isLoading = false;
      this.notFound = true;
      return;
    }
    this.isLoading = true;
    this.notFound = false;
    this.error = '';
    this.fulfilmentError = '';

    forkJoin({
      order: this.http.get<AdminOrderView>(`/api/orders/${this.orderId}`),
      // The group view is a separate call: an order still reads without it.
      fulfilment: this.http.get<OrderFulfilmentView>(`/api/admin/orders/${this.orderId}/fulfilment`).pipe(
        map((f) => ({ view: f, error: '' })),
        catchError((err: HttpErrorResponse) =>
          of({ view: null, error: err.error?.error || 'Could not load the fulfilment groups for this order.' })
        )
      ),
    }).subscribe({
      next: ({ order, fulfilment }) => {
        this.order = order;
        this.fulfilment = fulfilment.view;
        this.fulfilmentError = fulfilment.error;
        this.isLoading = false;
        if (order?.orderNumber) {
          this.breadcrumbSegments = [
            ...this.breadcrumbSegments.slice(0, 2),
            { label: `Order ${order.orderNumber}` },
          ];
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.notFound = err.status === 404;
        this.error = this.notFound ? '' : err.error?.error || 'Could not load this order.';
      },
    });
  }

  get address(): string {
    return addressText(this.order?.shippingAddress, this.order?.shippingAddressLine);
  }

  get groups(): FulfilmentGroup[] {
    return this.fulfilment?.groups || [];
  }

  lineTotal(unitPrice: number, quantity: number): number {
    return (unitPrice || 0) * (quantity || 0);
  }

  groupTotal(g: FulfilmentGroup): number {
    return (g.lines || []).reduce((sum, l) => sum + this.lineTotal(l.unitPrice, l.quantity), 0);
  }

  statusText(status: string | null | undefined): string {
    return (status || '').replace(/_/g, ' ').toLowerCase();
  }
}
