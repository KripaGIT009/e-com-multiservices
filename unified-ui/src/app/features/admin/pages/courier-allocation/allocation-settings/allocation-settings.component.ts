import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import {
  AllocationSettings,
  DeliveryPartner,
  FULFILMENT_MODEL_LABELS,
  FulfilmentModel,
  STRATEGY_OPTIONS,
} from '../../../models';

const MODEL_ORDER: FulfilmentModel[] = ['FIRST_PARTY', 'SELLER', 'DROPSHIP'];

/** One card per fulfilment model: default courier, fallback strategy, manual override. */
@Component({
  selector: 'app-allocation-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './allocation-settings.component.html',
  styleUrls: ['./allocation-settings.component.scss'],
})
export class AllocationSettingsComponent implements OnInit {
  @Input() partners: DeliveryPartner[] = [];

  /** Editable copies, keyed by model, so an unsaved change can be discarded. */
  drafts: AllocationSettings[] = [];
  private saved = new Map<FulfilmentModel, AllocationSettings>();

  isLoading = true;
  loadError = '';
  savingModel: FulfilmentModel | null = null;
  errors: Partial<Record<FulfilmentModel, string>> = {};

  readonly modelLabels = FULFILMENT_MODEL_LABELS;
  readonly strategies = STRATEGY_OPTIONS;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.http.get<AllocationSettings[]>('/api/admin/allocation-settings').subscribe({
      next: (rows) => {
        const list = [...(rows || [])].sort(
          (a, b) => MODEL_ORDER.indexOf(a.fulfilmentModel) - MODEL_ORDER.indexOf(b.fulfilmentModel)
        );
        list.forEach((s) => this.saved.set(s.fulfilmentModel, s));
        this.drafts = list.map((s) => ({ ...s, defaultPartnerCode: s.defaultPartnerCode || '' }));
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load allocation settings.';
      },
    });
  }

  get activePartners(): DeliveryPartner[] {
    return this.partners.filter((p) => p.active);
  }

  /** A default that points at a disabled partner is kept visible rather than silently dropped. */
  inactiveDefault(d: AllocationSettings): DeliveryPartner | undefined {
    return d.defaultPartnerCode
      ? this.partners.find((p) => p.code === d.defaultPartnerCode && !p.active)
      : undefined;
  }

  strategyHelp(value: string): string {
    return this.strategies.find((s) => s.value === value)?.help || '';
  }

  isDirty(d: AllocationSettings): boolean {
    const s = this.saved.get(d.fulfilmentModel);
    if (!s) return false;
    return (s.defaultPartnerCode || '') !== (d.defaultPartnerCode || '')
      || s.fallbackStrategy !== d.fallbackStrategy
      || !!s.allowManualOverride !== !!d.allowManualOverride;
  }

  reset(d: AllocationSettings): void {
    const s = this.saved.get(d.fulfilmentModel);
    if (!s) return;
    Object.assign(d, { ...s, defaultPartnerCode: s.defaultPartnerCode || '' });
    delete this.errors[d.fulfilmentModel];
  }

  save(d: AllocationSettings): void {
    this.savingModel = d.fulfilmentModel;
    delete this.errors[d.fulfilmentModel];
    const body = {
      defaultPartnerCode: d.defaultPartnerCode || null,
      fallbackStrategy: d.fallbackStrategy,
      allowManualOverride: !!d.allowManualOverride,
    };
    this.http.put<AllocationSettings>(`/api/admin/allocation-settings/${d.fulfilmentModel}`, body).subscribe({
      next: (updated) => {
        this.savingModel = null;
        const row = updated && updated.fulfilmentModel ? updated : { ...d, ...body };
        this.saved.set(d.fulfilmentModel, row);
        Object.assign(d, { ...row, defaultPartnerCode: row.defaultPartnerCode || '' });
        this.notify.show(`Settings for ${this.modelLabels[d.fulfilmentModel].toLowerCase()} saved.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.savingModel = null;
        this.errors[d.fulfilmentModel] = err.error?.error || 'Could not save these settings.';
      },
    });
  }
}
