import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { NotificationService } from '@core/services/notification.service';
import {
  DropshipListing,
  DropshipPartner,
  ITEM_TYPES,
  NewListingRequest,
} from '../../../models';

interface ListingEdit {
  partnerSku: string;
  costPrice: number | null;
  partnerStock: number | null;
  name: string;
  price: number | null;
  quantity: number | null;
  active: boolean;
}

function blankListing(): NewListingRequest {
  return {
    partnerCode: '', partnerSku: '', costPrice: null, sku: '', name: '',
    description: '', price: null, quantity: 0, itemType: '',
  };
}

@Component({
  selector: 'app-dropship-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dropship-catalogue.component.html',
  styleUrls: ['./dropship-catalogue.component.scss'],
})
export class DropshipCatalogueComponent implements OnInit {
  listings: DropshipListing[] = [];
  partners: DropshipPartner[] = [];
  isLoading = true;
  loadError = '';
  filterPartner = '';

  showAdd = false;
  draft: NewListingRequest = blankListing();
  adding = false;
  addError = '';

  editingId: number | null = null;
  edit: ListingEdit | null = null;
  saving = false;
  editError = '';
  confirmDeleteId: number | null = null;
  busyId: number | null = null;

  readonly itemTypes = ITEM_TYPES;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  ngOnInit(): void {
    this.http.get<DropshipPartner[]>('/api/admin/dropship/partners').subscribe({
      next: (p) => (this.partners = p || []),
      error: () => this.notify.show('Could not load dropship partners.', 'warning'),
    });
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    const query = this.filterPartner ? `?partnerCode=${encodeURIComponent(this.filterPartner)}` : '';
    this.http.get<DropshipListing[]>(`/api/admin/dropship/listings${query}`).subscribe({
      next: (l) => { this.listings = l || []; this.isLoading = false; },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.loadError = err.error?.error || 'Could not load dropship listings.';
      },
    });
  }

  get activePartners(): DropshipPartner[] {
    return this.partners.filter((p) => p.active);
  }

  partnerName(code: string): string {
    return this.partners.find((p) => p.code === code)?.name || code;
  }

  /** Live preview while typing; the server recomputes and rejects price ≤ cost. */
  previewMargin(price: number | null, cost: number | null): number | null {
    if (price == null || cost == null) return null;
    return Number(price) - Number(cost);
  }

  previewMarginPercent(price: number | null, cost: number | null): number | null {
    const margin = this.previewMargin(price, cost);
    if (margin == null || !price) return null;
    return (margin / Number(price)) * 100;
  }

  openAdd(): void {
    this.draft = blankListing();
    this.draft.partnerCode = this.filterPartner || this.activePartners[0]?.code || '';
    this.addError = '';
    this.showAdd = true;
  }

  add(): void {
    const d = this.draft;
    if (!d.partnerCode || !d.partnerSku.trim() || !d.sku.trim() || !d.name.trim()) {
      this.addError = 'Partner, partner SKU, our SKU and the product name are all needed.';
      return;
    }
    if (d.costPrice == null || d.price == null || Number(d.costPrice) <= 0) {
      this.addError = 'Enter a cost price above zero and a selling price.';
      return;
    }
    if (Number(d.price) <= Number(d.costPrice)) {
      this.addError = 'The selling price must be above the cost price, or every sale loses money.';
      return;
    }
    this.adding = true;
    this.addError = '';
    this.http.post<DropshipListing>('/api/admin/dropship/listings', d).subscribe({
      next: () => {
        this.adding = false;
        this.showAdd = false;
        this.notify.show(`${d.name} listed.`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.adding = false;
        this.addError = err.error?.error || 'Could not create the listing.';
      },
    });
  }

  openEdit(l: DropshipListing): void {
    this.editingId = l.id;
    this.editError = '';
    this.edit = {
      partnerSku: l.partnerSku, costPrice: l.costPrice, partnerStock: l.partnerStock ?? null,
      name: l.name || '', price: l.price ?? null, quantity: l.quantity ?? null, active: l.active,
    };
  }

  closeEdit(): void {
    this.editingId = null;
    this.edit = null;
    this.editError = '';
  }

  saveEdit(l: DropshipListing): void {
    const e = this.edit;
    if (!e) return;
    if (e.costPrice == null || Number(e.costPrice) <= 0) {
      this.editError = 'Cost price must be above zero.';
      return;
    }
    if (e.price != null && Number(e.price) <= Number(e.costPrice)) {
      this.editError = 'The selling price must be above the cost price.';
      return;
    }
    this.saving = true;
    this.editError = '';
    this.http.put<DropshipListing>(`/api/admin/dropship/listings/${l.id}`, e).subscribe({
      next: () => {
        this.saving = false;
        this.closeEdit();
        this.notify.show('Listing saved.', 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.editError = err.error?.error || 'Could not save the listing.';
      },
    });
  }

  remove(l: DropshipListing): void {
    this.busyId = l.id;
    this.http.delete(`/api/admin/dropship/listings/${l.id}`).subscribe({
      next: () => {
        this.busyId = null;
        this.confirmDeleteId = null;
        this.listings = this.listings.filter((x) => x.id !== l.id);
        this.notify.show('Listing and its catalogue item removed.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busyId = null;
        this.notify.show(err.error?.error || 'Could not delete the listing.', 'error');
      },
    });
  }
}
