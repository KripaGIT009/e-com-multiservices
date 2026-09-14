import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import {
  AllocationQuote,
  DeliveryPartner,
  IntegrationInfo,
  REASON_LABELS,
} from '../../models';

/** The fields an admin may set on a courier. */
type PartnerDraft = Pick<
  DeliveryPartner,
  | 'code' | 'name' | 'integrationType' | 'estimatedDays' | 'baseRate' | 'servicePincodePrefixes'
  | 'trackingUrlTemplate' | 'priority' | 'codSupported' | 'active'
>;

function blankDraft(): PartnerDraft {
  return {
    code: '', name: '', integrationType: 'MANUAL', estimatedDays: 5, baseRate: 0,
    servicePincodePrefixes: '', trackingUrlTemplate: '', priority: 100, codSupported: true, active: true,
  };
}

@Component({
  selector: 'app-delivery-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './delivery-partners.component.html',
  styleUrls: ['./delivery-partners.component.scss'],
})
export class DeliveryPartnersComponent implements OnInit {
  partners: DeliveryPartner[] = [];
  integrations: IntegrationInfo[] = [];
  isLoading = true;
  loadError = '';
  savingId: number | null = null;

  /** Row being edited, held as a copy so Cancel really discards. */
  editingId: number | null = null;
  draft: PartnerDraft = blankDraft();

  showAdd = false;
  addDraft: PartnerDraft = blankDraft();
  adding = false;
  addError = '';

  /** Quick coverage check, answered by the same allocation engine checkout uses. */
  testPincode = '';
  testResult: AllocationQuote | null = null;
  readonly reasonLabels = REASON_LABELS;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
    this.http.get<IntegrationInfo[]>('/api/admin/carrier-integrations').subscribe({
      next: (list) => (this.integrations = list || []),
      error: () => this.notify.show('Could not load the list of carrier integrations.', 'warning'),
    });
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    // all=true keeps disabled partners visible so they can be switched back on.
    this.http.get<DeliveryPartner[]>('/api/delivery-partners?all=true').subscribe({
      next: (p) => {
        this.partners = [...(p || [])].sort((a, b) => a.estimatedDays - b.estimatedDays);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load delivery partners.';
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

  integrationFor(key: string | null | undefined): IntegrationInfo | undefined {
    return this.integrations.find((i) => i.key === key);
  }

  isManual(p: DeliveryPartner): boolean {
    return !p.integrationType || p.integrationType === 'MANUAL';
  }

  edit(p: DeliveryPartner): void {
    this.editingId = p.id;
    this.draft = {
      code: p.code, name: p.name, integrationType: p.integrationType || 'MANUAL',
      estimatedDays: p.estimatedDays, baseRate: p.baseRate,
      servicePincodePrefixes: p.servicePincodePrefixes || '', trackingUrlTemplate: p.trackingUrlTemplate || '',
      priority: p.priority ?? 100, codSupported: p.codSupported ?? true, active: p.active,
    };
  }

  cancel(): void {
    this.editingId = null;
  }

  save(p: DeliveryPartner): void {
    this.savingId = p.id;
    // Code is the partner's identity and active has its own toggle, so neither is sent.
    const d = this.draft;
    const changes = {
      name: d.name, integrationType: d.integrationType, estimatedDays: d.estimatedDays,
      baseRate: d.baseRate, servicePincodePrefixes: d.servicePincodePrefixes,
      trackingUrlTemplate: d.trackingUrlTemplate, priority: d.priority, codSupported: d.codSupported,
    };
    this.http.put<DeliveryPartner>(`/api/delivery-partners/${p.id}`, changes).subscribe({
      next: (updated) => {
        this.savingId = null;
        this.editingId = null;
        this.replace(updated);
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
    this.http.put<DeliveryPartner>(`/api/delivery-partners/${p.id}`, { active: !p.active }).subscribe({
      next: (updated) => {
        this.savingId = null;
        this.replace(updated);
        this.notify.show(`${updated.name} ${updated.active ? 'enabled' : 'disabled'}.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.savingId = null;
        this.notify.show(err.error?.error || 'Could not change that partner.', 'error');
      },
    });
  }

  openAdd(): void {
    this.addDraft = blankDraft();
    this.addError = '';
    this.showAdd = true;
  }

  add(): void {
    const d = this.addDraft;
    d.code = (d.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,20}$/.test(d.code)) {
      this.addError = 'Code must be 2–20 capital letters, digits or underscores, e.g. SHADOWFAX.';
      return;
    }
    if (!d.name.trim()) {
      this.addError = 'Give the courier a display name.';
      return;
    }
    this.adding = true;
    this.addError = '';
    this.http.post<DeliveryPartner>('/api/delivery-partners', d).subscribe({
      next: (created) => {
        this.adding = false;
        this.showAdd = false;
        this.partners = [...this.partners, created].sort((a, b) => a.estimatedDays - b.estimatedDays);
        this.notify.show(`${created.name} added.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.adding = false;
        this.addError = err.error?.error || 'Could not add the partner.';
      },
    });
  }

  checkCoverage(): void {
    const pin = this.testPincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      this.notify.show('Enter a 6-digit pincode.', 'warning');
      return;
    }
    const body = {
      fulfilmentModel: 'FIRST_PARTY', deliveryPincode: pin, deliveryState: null,
      pickupPincode: null, cod: false, preferredPartnerCode: null,
    };
    this.http.post<AllocationQuote>('/api/admin/courier-allocation/quote', body).subscribe({
      next: (r) => (this.testResult = r),
      error: (err: HttpErrorResponse) =>
        this.notify.show(err.error?.error || 'Could not check that pincode.', 'error'),
    });
  }

  private replace(updated: DeliveryPartner): void {
    this.partners = this.partners.map((x) => (x.id === updated.id ? updated : x));
  }
}
