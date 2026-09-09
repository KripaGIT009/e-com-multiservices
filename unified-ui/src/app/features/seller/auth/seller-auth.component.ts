import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { SellerPortalService } from '../seller.service';
import { NotificationService } from '../../../core/services/notification.service';
import { normaliseIndianMobile } from '../../auth/register/register.component';

@Component({
  selector: 'app-seller-auth',
  templateUrl: './seller-auth.component.html',
  styleUrls: ['./seller-auth.component.scss'],
})
export class SellerAuthComponent {
  mode: 'login' | 'register' = 'login';
  form: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private portal: SellerPortalService,
    private notify: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.mode = this.route.snapshot.data['mode'] === 'register' ? 'register' : 'login';
    this.form = this.buildForm();
  }

  private buildForm(): FormGroup {
    if (this.mode === 'login') {
      return this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
      });
    }
    return this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      contactName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, (c: any) =>
        !c.value || normaliseIndianMobile(c.value) ? null : { invalidMobile: true }]],
      // Optional at sign-up: a seller can register and add it before approval.
      gstin: ['', [Validators.pattern(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
      pickupAddress: ['', [Validators.required]],
      pickupCity: ['', [Validators.required]],
      pickupPostalCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  f(name: string) { return this.form.get(name); }

  /** True once a field is both invalid and has been interacted with. */
  isBad(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  switchMode(): void {
    this.router.navigate([this.mode === 'login' ? '/seller/register' : '/seller/login']);
  }

  onSubmit(): void {
    this.submitError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.submitError = 'Please correct the highlighted fields.';
      return;
    }
    this.isSubmitting = true;

    const done = {
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/seller/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.submitError = err.error?.error || 'Something went wrong. Please try again.';
        this.notify.show(this.submitError as string, 'error');
      },
    };

    if (this.mode === 'login') {
      const { email, password } = this.form.value;
      this.portal.login(email, password).subscribe(done);
    } else {
      const v = this.form.value;
      this.portal.register({
        ...v,
        phone: normaliseIndianMobile(v.phone) ?? v.phone,
        gstin: v.gstin ? String(v.gstin).toUpperCase() : undefined,
      }).subscribe({
        ...done,
        next: () => {
          this.isSubmitting = false;
          this.notify.show('Seller account created. An admin will review it shortly.', 'success');
          this.router.navigate(['/seller/dashboard']);
        },
      });
    }
  }
}
