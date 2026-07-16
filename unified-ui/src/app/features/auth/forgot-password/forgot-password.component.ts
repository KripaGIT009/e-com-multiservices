import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  isSubmitting = false;
  resetSuccess = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetForm.value;
    if (newPassword !== confirmPassword) {
      this.notificationService.show('Passwords do not match.', 'error');
      return;
    }

    this.isSubmitting = true;
    const { email } = this.resetForm.value;
    this.http.post<{ message: string }>('/api/auth/forgot-password', { email, newPassword }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.resetSuccess = true;
        this.notificationService.show(res.message, 'success');
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.error || 'Failed to reset password.';
        this.notificationService.show(msg, 'error');
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  get email() { return this.resetForm.get('email'); }
  get newPassword() { return this.resetForm.get('newPassword'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }
}
