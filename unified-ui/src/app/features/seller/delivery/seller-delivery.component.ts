import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { NotificationService } from '../../../core/services/notification.service';

interface DeliveryPartner {
  id: number;
  code: string;
  name: string;
  trackingUrlTemplate?: string;
  estimatedDays: number;
  baseRate: number;
  active: boolean;
  servicePincodePrefixes?: string;
  collectsFromYou?: boolean;
}

@Component({
  selector: 'app-seller-delivery',
  templateUrl: './seller-delivery.component.html',
  styleUrls: ['./seller-delivery.component.scss'],
})
export class SellerDeliveryComponent implements OnInit {
  partners: DeliveryPartner[] = [];
  pickupPostalCode: string | null = null;
  isLoading = true;

  constructor(
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.http
      .get<{ pickupPostalCode: string | null; partners: DeliveryPartner[] }>(
        '/api/seller/delivery-partners'
      )
      .subscribe({
        next: (r) => {
          this.pickupPostalCode = r.pickupPostalCode;
          // Fastest first — that is the one checkout assigns.
          this.partners = [...r.partners].sort((a, b) => a.estimatedDays - b.estimatedDays);
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.notify.show('Could not load delivery partners.', 'error');
        },
      });
  }

  get available(): DeliveryPartner[] {
    return this.partners.filter((p) => p.active && p.collectsFromYou);
  }

  /** The courier checkout picks: fastest that serves the route. */
  get defaultPartner(): DeliveryPartner | null {
    return this.available[0] || null;
  }

  coverage(p: DeliveryPartner): string {
    return p.servicePincodePrefixes && p.servicePincodePrefixes.trim()
      ? 'Pincodes starting ' + p.servicePincodePrefixes
      : 'Nationwide';
  }
}
