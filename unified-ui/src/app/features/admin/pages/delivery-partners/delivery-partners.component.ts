import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';

export interface DeliveryPartner {
  id: number;
  code: string;
  name: string;
  trackingUrlTemplate?: string;
  estimatedDays: number;
  baseRate: number;
  active: boolean;
  servicePincodePrefixes?: string;
}

@Component({
  selector: 'app-delivery-partners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './delivery-partners.component.html',
  styleUrls: ['./delivery-partners.component.scss'],
})
export class DeliveryPartnersComponent implements OnInit {
  partners: DeliveryPartner[] = [];
  isLoading = true;
  savingId: number | null = null;

  /** Row being edited, held as a copy so Cancel really discards. */
  editing: DeliveryPartner | null = null;

  /** Pincode the operator is testing coverage for. */
  testPincode = '';
  testResult: DeliveryPartner[] | null = null;

  constructor(
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<DeliveryPartner[]>('/api/delivery-partners').subscribe({
      next: (p) => {
        this.partners = [...p].sort((a, b) => a.estimatedDays - b.estimatedDays);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notify.show('Could not load delivery partners.', 'error');
      },
    });
  }

  get activeCount(): number {
    return this.partners.filter((p) => p.active).length;
  }

  coverage(p: DeliveryPartner): string {
    return p.servicePincodePrefixes && p.servicePincodePrefixes.trim()
      ? 'Pincodes starting ' + p.servicePincodePrefixes
      : 'Nationwide';
  }

  edit(p: DeliveryPartner): void {
    this.editing = { ...p };
  }

  cancel(): void {
    this.editing = null;
  }

  save(): void {
    if (!this.editing) return;
    const partner = this.editing;
    this.savingId = partner.id;
    this.http.put<DeliveryPartner>(`/api/delivery-partners/${partner.id}`, partner).subscribe({
      next: (updated) => {
        this.savingId = null;
        this.editing = null;
        this.partners = this.partners.map((p) => (p.id === updated.id ? updated : p));
        this.notify.show(`${updated.name} updated.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.savingId = null;
        this.notify.show(err.error?.error || 'Could not save the partner.', 'error');
      },
    });
  }

  /** Enable or disable without opening the editor — the most common change. */
  toggleActive(p: DeliveryPartner): void {
    this.savingId = p.id;
    this.http.put<DeliveryPartner>(`/api/delivery-partners/${p.id}`, { ...p, active: !p.active }).subscribe({
      next: (updated) => {
        this.savingId = null;
        this.partners = this.partners.map((x) => (x.id === updated.id ? updated : x));
        this.notify.show(
          `${updated.name} ${updated.active ? 'enabled' : 'disabled'}.`,
          'success'
        );
      },
      error: () => {
        this.savingId = null;
        this.notify.show('Could not change that partner.', 'error');
      },
    });
  }

  /** Shows exactly which couriers an order to this pincode could be assigned. */
  checkCoverage(): void {
    const pin = this.testPincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      this.notify.show('Enter a 6-digit pincode.', 'warning');
      return;
    }
    this.http.get<DeliveryPartner[]>(`/api/delivery-partners/serviceable/${pin}`).subscribe({
      next: (r) => { this.testResult = r; },
      error: () => this.notify.show('Could not check that pincode.', 'error'),
    });
  }
}
