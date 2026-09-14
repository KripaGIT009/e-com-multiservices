import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import {
  CourierRule,
  DeliveryPartner,
  FULFILMENT_MODEL_LABELS,
  FulfilmentModel,
  INDIAN_STATES_AND_UTS,
  splitList,
} from '../../../models';

interface RuleDraft {
  name: string;
  partnerCode: string;
  pincodePrefixes: string;
  states: string[];
  fulfilmentModel: FulfilmentModel | '';
  priority: number;
  active: boolean;
}

function blankRule(): RuleDraft {
  return { name: '', partnerCode: '', pincodePrefixes: '', states: [], fulfilmentModel: 'FIRST_PARTY', priority: 100, active: true };
}

/** Location rules: pincode prefixes or states that send an order to a particular courier. */
@Component({
  selector: 'app-courier-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './courier-rules.component.html',
  styleUrls: ['./courier-rules.component.scss'],
})
export class CourierRulesComponent implements OnInit {
  @Input() partners: DeliveryPartner[] = [];

  rules: CourierRule[] = [];
  isLoading = true;
  loadError = '';
  busyId: number | null = null;

  /** 'new' for the add form, a rule id for inline edit, null when closed. */
  editing: number | 'new' | null = null;
  draft: RuleDraft = blankRule();
  saving = false;
  formError = '';
  confirmDeleteId: number | null = null;

  readonly states = INDIAN_STATES_AND_UTS;
  readonly modelLabels = FULFILMENT_MODEL_LABELS;
  readonly models: FulfilmentModel[] = ['FIRST_PARTY', 'SELLER', 'DROPSHIP'];

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.http.get<CourierRule[]>('/api/admin/courier-rules').subscribe({
      next: (r) => { this.rules = r || []; this.isLoading = false; },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load courier rules.';
      },
    });
  }

  partnerName(code: string): string {
    return this.partners.find((p) => p.code === code)?.name || code;
  }

  partnerInactive(code: string): boolean {
    return this.partners.some((p) => p.code === code && !p.active);
  }

  list(value: string | null | undefined): string[] {
    return splitList(value);
  }

  openNew(): void {
    this.editing = 'new';
    this.draft = blankRule();
    this.formError = '';
  }

  openEdit(r: CourierRule): void {
    this.editing = r.id;
    this.formError = '';
    this.draft = {
      name: r.name, partnerCode: r.partnerCode, pincodePrefixes: r.pincodePrefixes || '',
      states: splitList(r.states), fulfilmentModel: r.fulfilmentModel || '',
      priority: r.priority, active: r.active,
    };
  }

  close(): void {
    this.editing = null;
    this.formError = '';
  }

  toggleState(state: string, checked: boolean): void {
    const set = new Set(this.draft.states);
    if (checked) { set.add(state); } else { set.delete(state); }
    this.draft.states = this.states.filter((s) => set.has(s));
  }

  save(): void {
    const d = this.draft;
    const prefixes = splitList(d.pincodePrefixes);
    if (!d.name.trim() || !d.partnerCode) {
      this.formError = 'A rule needs a name and a courier.';
      return;
    }
    if (prefixes.length === 0 && d.states.length === 0) {
      this.formError = 'Give at least one pincode prefix or state.';
      return;
    }
    const body = {
      name: d.name.trim(), partnerCode: d.partnerCode,
      pincodePrefixes: prefixes.length ? prefixes.join(',') : null,
      states: d.states.length ? d.states.join(',') : null,
      fulfilmentModel: d.fulfilmentModel || null,
      priority: Number(d.priority), active: d.active,
    };
    const id = this.editing;
    const req = id === 'new'
      ? this.http.post<CourierRule>('/api/admin/courier-rules', body)
      : this.http.put<CourierRule>(`/api/admin/courier-rules/${id}`, body);
    this.saving = true;
    this.formError = '';
    req.subscribe({
      next: () => {
        this.saving = false;
        this.editing = null;
        this.notify.show(id === 'new' ? 'Rule added.' : 'Rule saved.', 'success');
        this.load(); // order depends on priority and id, which the server owns
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.formError = err.error?.error || 'Could not save the rule.';
      },
    });
  }

  toggleActive(r: CourierRule): void {
    this.busyId = r.id;
    const body = {
      name: r.name, partnerCode: r.partnerCode, pincodePrefixes: r.pincodePrefixes || null,
      states: r.states || null, fulfilmentModel: r.fulfilmentModel || null,
      priority: r.priority, active: !r.active,
    };
    this.http.put<CourierRule>(`/api/admin/courier-rules/${r.id}`, body).subscribe({
      next: (u) => {
        this.busyId = null;
        this.rules = this.rules.map((x) => (x.id === r.id ? (u && u.id ? u : { ...r, active: !r.active }) : x));
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.notify.show(err.error?.error || 'Could not change that rule.', 'error');
      },
    });
  }

  remove(r: CourierRule): void {
    this.busyId = r.id;
    this.http.delete(`/api/admin/courier-rules/${r.id}`).subscribe({
      next: () => {
        this.busyId = null;
        this.confirmDeleteId = null;
        this.rules = this.rules.filter((x) => x.id !== r.id);
        this.notify.show(`Rule "${r.name}" deleted.`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.notify.show(err.error?.error || 'Could not delete that rule.', 'error');
      },
    });
  }
}
