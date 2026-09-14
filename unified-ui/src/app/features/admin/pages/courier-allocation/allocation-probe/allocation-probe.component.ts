import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import {
  AllocationQuote,
  AllocationQuoteRequest,
  DeliveryPartner,
  FULFILMENT_MODEL_LABELS,
  FulfilmentModel,
  INDIAN_STATES_AND_UTS,
  REASON_LABELS,
} from '../../../models';
import { AllocationReasonComponent } from '../../../components/allocation-reason/allocation-reason.component';

/** Preview of the allocation decision. Nothing is booked. */
@Component({
  selector: 'app-allocation-probe',
  standalone: true,
  imports: [CommonModule, FormsModule, AllocationReasonComponent],
  templateUrl: './allocation-probe.component.html',
  styleUrls: ['./allocation-probe.component.scss'],
})
export class AllocationProbeComponent {
  @Input() partners: DeliveryPartner[] = [];

  model: FulfilmentModel = 'FIRST_PARTY';
  pincode = '';
  state = '';
  cod = false;
  preferred = '';

  result: AllocationQuote | null = null;
  checking = false;
  error = '';

  readonly models: FulfilmentModel[] = ['FIRST_PARTY', 'SELLER', 'DROPSHIP'];
  readonly modelLabels = FULFILMENT_MODEL_LABELS;
  readonly reasonLabels = REASON_LABELS;
  readonly states = INDIAN_STATES_AND_UTS;

  constructor(private http: HttpClient) {}

  get pincodeValid(): boolean {
    return /^\d{6}$/.test(this.pincode.trim());
  }

  run(): void {
    if (!this.pincodeValid) {
      this.error = 'Enter a 6-digit pincode.';
      return;
    }
    const body: AllocationQuoteRequest = {
      fulfilmentModel: this.model,
      deliveryPincode: this.pincode.trim(),
      deliveryState: this.state || null,
      pickupPincode: null,
      cod: this.cod,
      preferredPartnerCode: this.preferred || null,
    };
    this.checking = true;
    this.error = '';
    this.http.post<AllocationQuote>('/api/admin/courier-allocation/quote', body).subscribe({
      next: (r) => { this.checking = false; this.result = r; },
      error: (err: HttpErrorResponse) => {
        this.checking = false;
        this.result = null;
        this.error = err.error?.error || 'Could not run the allocation.';
      },
    });
  }
}
