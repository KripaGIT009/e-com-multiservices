import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

  /** Set when the credentials belong to a seller, so we can point them next door. */
  isSellerAccount = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
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

  /**
   * Where to land after signing in.
   *
   * Prefers wherever the user was trying to go — added to a cart, then asked to sign
   * in, they should come back to the cart, not be dropped on their profile page.
   * Only same-origin relative paths are honoured, so the query parameter cannot be
   * used to bounce someone to another site.
   */
  private redirectAfterAuth(role: string): string {
    if (role === 'ADMIN') return '/admin';

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const isSafe = !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
    if (isSafe && !returnUrl!.startsWith('/auth') && !returnUrl!.startsWith('/login')) {
      return returnUrl!;
    }
    // No destination in mind — back to shopping, not the account page.
    return '/home';
  }

  onSubmit(): void {
    this.submitError = null;
    this.isSellerAccount = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.submitError = 'Please enter your email address and password.';
      return;
    }

    this.isSubmitting = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.router.navigateByUrl(this.redirectAfterAuth(response.user.role));
      },
      error: (err) => {
        this.isSubmitting = false;
        this.isSellerAccount = !!err?.error?.sellerAccount;
        this.submitError = this.isSellerAccount
          ? err.error.error
          : 'Invalid email or password. Please try again.';
        this.notificationService.show(this.submitError as string, 'error');
      },
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
