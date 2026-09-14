import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import { DropshipPartner, IntegrationInfo, ONBOARDING_STATUSES } from '../../../models';

function blankPartner(): DropshipPartner {
  return {
    code: '', name: '', bestFor: '', integrationPotential: '', website: '', integrationType: 'MANUAL',
    onboardingStatus: 'NOT_STARTED', shipsWithOwnLogistics: true, warehousePincode: '',
    contactEmail: '', notes: '', active: false,
  };
}

@Component({
  selector: 'app-dropship-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dropship-partners.component.html',
  styleUrls: ['./dropship-partners.component.scss'],
})
export class DropshipPartnersComponent implements OnInit {
  partners: DropshipPartner[] = [];
  integrations: IntegrationInfo[] = [];
  isLoading = true;
  loadError = '';

  /** Code of the partner being edited, 'new' for the add form. */
  editing: string | null = null;
  draft: DropshipPartner = blankPartner();
  saving = false;
  formError = '';

  readonly statuses = ONBOARDING_STATUSES;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
    this.http.get<IntegrationInfo[]>('/api/admin/dropship/integrations').subscribe({
      next: (list) => (this.integrations = list || []),
      error: () => this.notify.show('Could not load the list of dropship integrations.', 'warning'),
    });
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.http.get<DropshipPartner[]>('/api/admin/dropship/partners').subscribe({
      next: (p) => {
        this.partners = [...(p || [])].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name));
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load dropship partners.';
      },
    });
  }

  get activeCount(): number {
    return this.partners.filter((p) => p.active).length;
  }

  integration(key: string | null | undefined): IntegrationInfo | undefined {
    return this.integrations.find((i) => i.key === key);
  }

  isManual(p: DropshipPartner): boolean {
    return !p.integrationType || p.integrationType === 'MANUAL';
  }

  statusLabel(value: string): string {
    return this.statuses.find((s) => s.value === value)?.label || value;
  }

  openNew(): void {
    this.editing = 'new';
    this.draft = blankPartner();
    this.formError = '';
  }

  openEdit(p: DropshipPartner): void {
    this.editing = p.code;
    this.draft = { ...p };
    this.formError = '';
  }

  close(): void {
    this.editing = null;
    this.formError = '';
  }

  save(): void {
    const d = this.draft;
    const isNew = this.editing === 'new';
    if (isNew) {
      d.code = (d.code || '').trim().toUpperCase();
      if (!/^[A-Z0-9_]{2,30}$/.test(d.code)) {
        this.formError = 'Code must be 2–30 capital letters, digits or underscores.';
        return;
      }
      if (!d.name.trim()) {
        this.formError = 'Give the partner a name.';
        return;
      }
    }
    const pin = (d.warehousePincode || '').trim();
    if (pin && !/^\d{6}$/.test(pin)) {
      this.formError = 'Warehouse pincode must be 6 digits, or left empty.';
      return;
    }
    const editable = {
      website: d.website || null, contactEmail: d.contactEmail || null, notes: d.notes || null,
      onboardingStatus: d.onboardingStatus, integrationType: d.integrationType,
      shipsWithOwnLogistics: !!d.shipsWithOwnLogistics, warehousePincode: pin || null, active: d.active,
    };
    const req = isNew
      ? this.http.post<DropshipPartner>('/api/admin/dropship/partners', {
          ...editable, code: d.code, name: d.name.trim(),
          bestFor: d.bestFor || null, integrationPotential: d.integrationPotential || null,
        })
      : this.http.put<DropshipPartner>(`/api/admin/dropship/partners/${encodeURIComponent(this.editing || '')}`, editable);
    this.saving = true;
    this.formError = '';
    req.subscribe({
      next: (saved) => {
        this.saving = false;
        this.editing = null;
        this.notify.show(`${saved?.name || d.name} ${isNew ? 'added' : 'saved'}.`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.formError = err.error?.error || 'Could not save the partner.';
      },
    });
  }
}
