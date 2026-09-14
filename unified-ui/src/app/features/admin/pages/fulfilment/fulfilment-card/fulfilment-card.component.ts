import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
  addressText,
  CourierOption,
  DeliveryPartner,
  FulfilmentBooking,
  FulfilmentQueueOrder,
  ShipmentView,
  ShipRequest,
} from '../../../models';
import { AllocationReasonComponent } from '../../../components/allocation-reason/allocation-reason.component';

/** One order in the own-product queue, with its ship panel. */
@Component({
  selector: 'app-fulfilment-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AllocationReasonComponent],
  templateUrl: './fulfilment-card.component.html',
  styleUrls: ['./fulfilment-card.component.scss'],
})
export class FulfilmentCardComponent implements OnChanges {
  @Input({ required: true }) order!: FulfilmentQueueOrder;
  @Input() partners: DeliveryPartner[] = [];
  @Input() shippedView = false;
  @Output() booked = new EventEmitter<FulfilmentBooking>();

  partnerCode = '';
  trackingNumber = '';
  shipping = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnChanges(): void {
    if (!this.partnerCode) {
      this.partnerCode = this.order?.suggestion?.selected?.code || '';
    }
  }

  get address(): string {
    return addressText(this.order.shippingAddress, this.order.shippingAddressLine);
  }

  /** Only partners the allocation engine found serving this pincode are offered. */
  get options(): CourierOption[] {
    return this.order.suggestion?.candidates || [];
  }

  get total(): number {
    return (this.order.lines || []).reduce((sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 0), 0);
  }

  /**
   * A tracking number is asked for only when the chosen courier is booked manually —
   * a manual integration, or an API one whose credentials are not configured.
   */
  get needsTrackingInput(): boolean {
    const p = this.partners.find((x) => x.code === this.partnerCode);
    if (!p) return true;
    return !p.integrationType || p.integrationType === 'MANUAL' || !p.integrationConfigured;
  }

  get changedFromSuggestion(): boolean {
    const suggested = this.order.suggestion?.selected?.code;
    return !!suggested && !!this.partnerCode && suggested !== this.partnerCode;
  }

  ship(): void {
    if (!this.partnerCode) {
      this.error = 'Choose a courier.';
      return;
    }
    const body: ShipRequest = {
      partnerCode: this.partnerCode,
      trackingNumber: this.needsTrackingInput && this.trackingNumber.trim() ? this.trackingNumber.trim() : null,
    };
    this.shipping = true;
    this.error = '';
    this.http
      .post<ShipmentView | { shipment: ShipmentView }>(`/api/admin/fulfilment/${this.order.orderId}/ship`, body)
      .subscribe({
        next: (res) => {
          this.shipping = false;
          const shipment = res && 'shipment' in res && res.shipment ? res.shipment : (res as ShipmentView);
          this.booked.emit({ order: this.order, shipment });
        },
        error: (err: HttpErrorResponse) => {
          this.shipping = false;
          this.error = err.error?.error
            || (err.status === 422 ? 'The courier could not take this shipment.' : 'Could not book the shipment.');
        },
      });
  }
}
