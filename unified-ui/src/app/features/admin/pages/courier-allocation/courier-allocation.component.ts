import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { DeliveryPartner } from '../../models';
import { AllocationSettingsComponent } from './allocation-settings/allocation-settings.component';
import { CourierRulesComponent } from './courier-rules/courier-rules.component';
import { AllocationProbeComponent } from './allocation-probe/allocation-probe.component';

/**
 * Courier allocation (docs/commerce-architecture.md §6): the default courier per
 * fulfilment model, location rules, and a probe that previews the decision.
 * The page loads the partner list once and hands it to its three sections.
 */
@Component({
  selector: 'app-courier-allocation',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    AllocationSettingsComponent, CourierRulesComponent, AllocationProbeComponent,
  ],
  templateUrl: './courier-allocation.component.html',
  styleUrls: ['./courier-allocation.component.scss'],
})
export class CourierAllocationComponent implements OnInit {
  partners: DeliveryPartner[] = [];
  isLoading = true;
  loadError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPartners();
  }

  loadPartners(): void {
    this.isLoading = true;
    this.loadError = '';
    this.http.get<DeliveryPartner[]>('/api/delivery-partners?all=true').subscribe({
      next: (p) => {
        this.partners = [...(p || [])].sort((a, b) => a.name.localeCompare(b.name));
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load delivery partners.';
      },
    });
  }
}
