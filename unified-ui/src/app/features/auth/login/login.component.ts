import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  showPassword = false;

  /** Shown in the form itself, so the reason survives a dismissed toast. */
  submitError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  onSubmit(): void {
    this.submitError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.submitError = 'Please enter your email address and password.';
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const role = response.user.role;
        const redirect = role === 'ADMIN' ? '/admin' : role === 'CUSTOMER' ? '/account' : '/home';
        this.router.navigate([redirect]);
      },
      error: () => {
        this.isSubmitting = false;
        this.submitError = 'Invalid email or password. Please try again.';
        this.notificationService.show(this.submitError, 'error');
      },
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
