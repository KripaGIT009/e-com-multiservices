import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-myindianstore',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-myindianstore-container">
      <div class="auth-wrapper">
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo">
            <mat-icon class="logo-icon">shopping_cart</mat-icon>
            <span class="logo-text">MyStore</span>
          </div>
        </div>

        <!-- Login/Signup Forms -->
        <div class="auth-form-container" *ngIf="mode === 'signin'">
          <div class="form-card">
            <h1>Sign in</h1>
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email or mobile phone number</mat-label>
                <input matInput 
                       type="email" 
                       formControlName="email" 
                       autocomplete="email"
                       placeholder="Enter your email">
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Enter your email or mobile phone number
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput 
                       [type]="hidePassword ? 'password' : 'text'" 
                       formControlName="password"
                       autocomplete="current-password"
                       placeholder="Enter your password">
                <button type="button" 
                        mat-icon-button 
                        matSuffix 
                        (click)="hidePassword = !hidePassword"
                        tabindex="-1">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Enter your password
                </mat-error>
                <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <button 
                mat-raised-button 
                color="primary"
                type="submit"
                class="submit-btn full-width"
                [disabled]="loginForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
                <span *ngIf="!loading">Sign in</span>
                <span *ngIf="loading">Signing in...</span>
              </button>

              <div class="form-footer">
                <p class="terms">
                  By continuing, you agree to MyStore's 
                  <a href="#" class="link">Conditions of Use</a> and 
                  <a href="#" class="link">Privacy Notice</a>.
                </p>
              </div>

              <div class="help-links">
                <a href="#" class="link">
                  <mat-icon class="small-icon">arrow_forward</mat-icon>
                  Forgot your password?
                </a>
              </div>
            </form>
          </div>

          <!-- Create Account Section -->
          <mat-divider class="divider-section">
            <span class="divider-text">New to MyStore?</span>
          </mat-divider>

          <button 
            mat-stroked-button 
            class="create-account-btn full-width"
            (click)="switchMode('signup')">
            Create your MyStore account
          </button>
        </div>

        <!-- Signup Form -->
        <div class="auth-form-container" *ngIf="mode === 'signup'">
          <div class="form-card">
            <h1>Create account</h1>
            <form [formGroup]="signupForm" (ngSubmit)="onSignup()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your name</mat-label>
                <input matInput 
                       formControlName="username" 
                       placeholder="First and last name"
                       autocomplete="name">
                <mat-error *ngIf="signupForm.get('username')?.hasError('required')">
                  Enter your name
                </mat-error>
                <mat-error *ngIf="signupForm.get('username')?.hasError('minlength')">
                  Name must be at least 2 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mobile number or email</mat-label>
                <input matInput 
                       type="email" 
                       formControlName="email"
                       placeholder="Enter your email"
                       autocomplete="email">
                <mat-error *ngIf="signupForm.get('email')?.hasError('required')">
                  Enter your email or mobile phone number
                </mat-error>
                <mat-error *ngIf="signupForm.get('email')?.hasError('email')">
                  Enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput 
                       [type]="hideSignupPassword ? 'password' : 'text'" 
                       formControlName="password"
                       placeholder="At least 6 characters"
                       autocomplete="new-password">
                <button type="button" 
                        mat-icon-button 
                        matSuffix 
                        (click)="hideSignupPassword = !hideSignupPassword"
                        tabindex="-1">
                  <mat-icon>{{ hideSignupPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-hint>Passwords must be at least 6 characters.</mat-hint>
                <mat-error *ngIf="signupForm.get('password')?.hasError('required')">
                  Enter your password
                </mat-error>
                <mat-error *ngIf="signupForm.get('password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Re-enter password</mat-label>
                <input matInput 
                       [type]="hideConfirmPassword ? 'password' : 'text'" 
                       formControlName="confirmPassword"
                       autocomplete="new-password">
                <button type="button" 
                        mat-icon-button 
                        matSuffix 
                        (click)="hideConfirmPassword = !hideConfirmPassword"
                        tabindex="-1">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="signupForm.get('confirmPassword')?.hasError('required')">
                  Re-enter your password
                </mat-error>
                <mat-error *ngIf="signupForm.hasError('passwordMismatch')">
                  Passwords must match
                </mat-error>
              </mat-form-field>

              <button 
                mat-raised-button 
                color="primary"
                type="submit"
                class="submit-btn full-width"
                [disabled]="signupForm.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
                <span *ngIf="!loading">Create your MyStore account</span>
                <span *ngIf="loading">Creating account...</span>
              </button>

              <div class="form-footer">
                <p class="terms">
                  By creating an account, you agree to MyStore's 
                  <a href="#" class="link">Conditions of Use</a> and 
                  <a href="#" class="link">Privacy Notice</a>.
                </p>
              </div>
            </form>
          </div>

          <mat-divider class="divider-section"></mat-divider>

          <div class="signin-link">
            Already have an account? 
            <a href="#" class="link" (click)="switchMode('signin'); $event.preventDefault()">
              Sign in <mat-icon class="small-icon">arrow_forward</mat-icon>
            </a>
          </div>
        </div>

        <!-- Demo Credentials -->
        <div class="demo-section">
          <h3>Demo Credentials</h3>
          <div class="demo-credentials">
            <div class="demo-user">
              <strong>Customer:</strong> customer&#64;example.com / password
            </div>
            <div class="demo-user">
              <strong>Admin:</strong> admin&#64;example.com / password
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="auth-footer">
        <div class="footer-links">
          <a href="#">Conditions of Use</a>
          <a href="#">Privacy Notice</a>
          <a href="#">Help</a>
        </div>
        <p class="copyright">© 2025, MyStore.com, Inc. or its affiliates</p>
      </div>
    </div>
  `,
  styles: [`
    .auth-myindianstore-container {
      min-height: 100vh;
      background: linear-gradient(to bottom, #f7f8fa 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
    }

    .auth-wrapper {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 30px;
      padding-top: 20px;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      text-decoration: none;
      color: #232F3E;
    }

    .logo-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #FF9900;
    }

    .logo-text {
      font-size: 32px;
      font-weight: 700;
      color: #131921;
    }

    .auth-form-container {
      margin-bottom: 20px;
    }

    .form-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-card h1 {
      font-size: 28px;
      font-weight: 400;
      margin: 0 0 20px 0;
      color: #111;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .submit-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
      border-color: #a88734 #9c7e31 #846a29;
      color: #111;
      margin-top: 16px;
      position: relative;
    }

    .submit-btn:hover:not(:disabled) {
      background: linear-gradient(to bottom, #f5d78e, #edb932);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    .form-footer {
      margin-top: 24px;
    }

    .terms {
      font-size: 12px;
      color: #555;
      line-height: 1.5;
      text-align: center;
    }

    .help-links {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .link {
      color: #0066c0;
      text-decoration: none;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .link:hover {
      color: #c45500;
      text-decoration: underline;
    }

    .small-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .divider-section {
      margin: 30px 0;
      position: relative;
      text-align: center;
    }

    .divider-text {
      background: #f7f8fa;
      padding: 0 10px;
      color: #767676;
      font-size: 12px;
      position: relative;
      z-index: 1;
    }

    .create-account-btn {
      height: 44px;
      font-size: 14px;
      background: #fff;
      border: 1px solid #ddd;
      color: #111;
      box-shadow: 0 2px 5px rgba(15,17,17,0.15);
    }

    .create-account-btn:hover {
      background: #f7fafa;
    }

    .signin-link {
      text-align: center;
      margin-top: 20px;
      font-size: 13px;
      color: #555;
    }

    .demo-section {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .demo-section h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111;
    }

    .demo-credentials {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .demo-user {
      font-size: 13px;
      padding: 8px;
      background: #f7f8fa;
      border-radius: 4px;
      color: #555;
    }

    .demo-user strong {
      color: #111;
    }

    .auth-footer {
      margin-top: 40px;
      padding: 20px 0;
      text-align: center;
      width: 100%;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }

    .footer-links a {
      color: #0066c0;
      text-decoration: none;
      font-size: 12px;
    }

    .footer-links a:hover {
      color: #c45500;
      text-decoration: underline;
    }

    .copyright {
      font-size: 11px;
      color: #555;
    }

    ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      min-height: 20px;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background: white;
    }

    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background: transparent;
    }

    @media (max-width: 600px) {
      .auth-wrapper {
        max-width: 100%;
      }

      .form-card {
        padding: 20px;
      }

      .logo-text {
        font-size: 24px;
      }
    }
  `]
})
export class AuthMyindianstoreComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  mode: 'signin' | 'signup' = 'signin';
  hidePassword = true;
  hideSignupPassword = true;
  hideConfirmPassword = true;
  loading = false;
  private isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if already logged in
    if (this.isBrowser && this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Check query params for mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'signup') {
        this.mode = 'signup';
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  switchMode(mode: 'signin' | 'signup'): void {
    this.mode = mode;
    this.loginForm.reset();
    this.signupForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.invalid || !this.isBrowser) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`Welcome back, ${response.username || email}!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Navigate to return URL or home
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        setTimeout(() => {
          this.router.navigate([returnUrl]);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSignup(): void {
    if (this.signupForm.invalid || !this.isBrowser) {
      return;
    }

    this.loading = true;
    const { username, email, password } = this.signupForm.value;

    this.authService.signup(username, email, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`Welcome to MyStore, ${username}!`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });

        // Auto-login and redirect
        setTimeout(() => {
          this.authService.login(email, password).subscribe({
            next: () => {
              const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
              this.router.navigate([returnUrl]);
            },
            error: () => {
              this.router.navigate(['/auth']);
            }
          });
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.message || 'Unable to create account. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
