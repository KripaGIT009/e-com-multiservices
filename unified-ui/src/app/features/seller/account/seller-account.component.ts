import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { SellerPortalService, Seller } from '../seller.service';
import { NotificationService } from '../../../core/services/notification.service';
import { normaliseIndianMobile } from '../../auth/register/register.component';

@Component({
  selector: 'app-seller-account',
  templateUrl: './seller-account.component.html',
  styleUrls: ['./seller-account.component.scss'],
})
export class SellerAccountComponent implements OnInit {
  seller: Seller | null = null;
  form: FormGroup;
  isLoading = true;
  isSaving = false;
  saveError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private portal: SellerPortalService,
    private notify: NotificationService
  ) {
    this.form = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      contactName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, (c: any) =>
        !c.value || normaliseIndianMobile(c.value) ? null : { invalidMobile: true }]],
      pickupAddress: ['', [Validators.required]],
      pickupCity: ['', [Validators.required]],
      pickupPostalCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.portal.me().subscribe({
      next: (s) => {
        this.seller = s;
        this.form.patchValue({
          businessName: s.businessName, contactName: s.contactName, phone: s.phone,
          pickupAddress: s.pickupAddress || '', pickupCity: s.pickupCity || '',
          pickupPostalCode: s.pickupPostalCode || '',
        });
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; this.notify.show('Could not load your account.', 'error'); },
    });
  }

  isBad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  save(): void {
    this.saveError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError = 'Please correct the highlighted fields.';
      return;
    }
    this.isSaving = true;
    const v = this.form.value;
    this.portal.updateProfile({ ...v, phone: normaliseIndianMobile(v.phone) ?? v.phone }).subscribe({
      next: (s) => {
        this.isSaving = false;
        this.seller = s;
        this.notify.show('Account details saved.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.saveError = err.error?.error || 'Could not save your details.';
      },
    });
  }
}
