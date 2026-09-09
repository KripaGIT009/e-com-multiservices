import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface GenderOption {
  value: string;
  label: string;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  className: string;
}

/**
 * Normalises an Indian mobile number to its bare ten digits.
 *
 * Browsers autofill mobile numbers in several shapes — "+91 92504 44838",
 * "09250444838", "9250-444-838". The previous validator demanded exactly ten digits
 * and rejected every one of those, which silently blocked the whole form.
 */
export function normaliseIndianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Accepts any shape a browser might autofill, as long as it normalises to a valid number. */
function indianMobileValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  return normaliseIndianMobile(control.value) ? null : { invalidMobile: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;

  /** Set when the server rejects the submission, so the user sees why. */
  submitError: string | null = null;

  readonly genders: GenderOption[] = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, indianMobileValidator]],
        gender: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatchValidator }
    );
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get phone() { return this.registerForm.get('phone'); }
  get gender() { return this.registerForm.get('gender'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  /** Cross-field rule, so it lives on the group rather than on the confirm control. */
  get passwordsMismatch(): boolean {
    return !!this.registerForm.errors?.['passwordMismatch'] && !!this.confirmPassword?.touched;
  }

  get confirmInvalid(): boolean {
    return (
      (!!this.confirmPassword?.invalid || this.passwordsMismatch) &&
      !!this.confirmPassword?.touched
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /** Shows the caller how their number will actually be submitted. */
  get normalisedPhonePreview(): string | null {
    const normalised = normaliseIndianMobile(this.phone?.value);
    if (!normalised) return null;
    const raw = String(this.phone?.value ?? '').replace(/\D/g, '');
    // Only worth showing when we changed something.
    return raw === normalised ? null : `+91 ${normalised}`;
  }

  get passwordStrength(): PasswordStrength {
    const value: string = this.password?.value || '';
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;

    const levels: PasswordStrength[] = [
      { score: 0, label: '', className: '' },
      { score: 1, label: 'Weak', className: 'is-weak' },
      { score: 2, label: 'Fair', className: 'is-fair' },
      { score: 3, label: 'Good', className: 'is-good' },
      { score: 4, label: 'Strong', className: 'is-strong' },
    ];
    return levels[score];
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    this.submitError = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      // Previously this returned silently and the button appeared dead.
      this.submitError = 'Please correct the highlighted fields and try again.';
      this.focusFirstInvalidField();
      return;
    }

    this.isSubmitting = true;
    const { name, email, phone, gender, password } = this.registerForm.value;

    this.authService
      .register({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: normaliseIndianMobile(phone) ?? undefined,
        gender,
        password,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.notificationService.show(
            `Welcome, ${response.user.username || 'there'}! Your account is ready.`,
            'success'
          );
          // register() already stored the session, so send them into the app
          // rather than back to a login page they no longer need.
          this.router.navigate(['/account']);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.submitError =
            err.error?.error || 'We could not create your account. Please try again.';
          this.notificationService.show(this.submitError as string, 'error');
        },
      });
  }

  private focusFirstInvalidField(): void {
    const firstInvalid = document.querySelector<HTMLElement>(
      '.auth-form .ng-invalid input, .auth-form .ng-invalid select'
    );
    firstInvalid?.focus();
  }
}

/**
 * Flags a password/confirm mismatch on the *group*.
 *
 * Deliberately does not call confirm.setErrors(). Writing a child's errors from a
 * parent validator fights Angular's own validation pass: the child recomputes its
 * errors from its own validators, so the flag set here is applied and cleared out of
 * step, and a mismatch stayed on screen after the user had corrected it. Keeping the
 * error on the group — which owns the cross-field rule — avoids that entirely.
 */
function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password');
  const confirm = group.get('confirmPassword');
  if (!password || !confirm || !confirm.value) return null;
  return password.value === confirm.value ? null : { passwordMismatch: true };
}
