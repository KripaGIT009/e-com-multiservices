import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <mat-icon class="header-icon">shopping_bag</mat-icon>
          <h1>ShopHub</h1>
          <p>Your trusted shopping destination</p>
        </div>

        <mat-tab-group
          class="auth-tabs"
          [selectedIndex]="selectedTabIndex"
          (selectedIndexChange)="onTabChange($event)">
          
          <!-- Login Tab -->
          <mat-tab label="Login">
            <div class="tab-content">
              <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="your@email.com" />
                  <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                    Please enter a valid email
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Password</mat-label>
                  <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Enter your password" />
                  <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                    Password is required
                  </mat-error>
                </mat-form-field>

                <button 
                  mat-raised-button 
                  color="primary" 
                  class="submit-btn"
                  [disabled]="loginForm.invalid || loading">
                  <mat-icon *ngIf="!loading">login</mat-icon>
                  <span>{{ loading ? 'Logging in...' : 'Login' }}</span>
                </button>
              </form>

              <div class="divider">
                <span>or</span>
              </div>

              <button mat-stroked-button class="guest-btn">
                <mat-icon>person</mat-icon>
                Continue as Guest
              </button>

              <p class="demo-users">
                <strong>Demo Credentials:</strong><br/>
                Customer: customer&#64;example.com / password<br/>
                Admin: admin&#64;example.com / password
              </p>
            </div>
          </mat-tab>

          <!-- Sign Up Tab -->
          <mat-tab label="Sign Up">
            <div class="tab-content">
              <form [formGroup]="signupForm" (ngSubmit)="onSignup()">
                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Username</mat-label>
                  <input matInput formControlName="username" placeholder="Choose a username" />
                  <mat-error *ngIf="signupForm.get('username')?.hasError('required')">
                    Username is required
                  </mat-error>
                  <mat-error *ngIf="signupForm.get('username')?.hasError('minlength')">
                    Username must be at least 3 characters
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="your@email.com" />
                  <mat-error *ngIf="signupForm.get('email')?.hasError('required')">
                    Email is required
                  </mat-error>
                  <mat-error *ngIf="signupForm.get('email')?.hasError('email')">
                    Please enter a valid email
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Password</mat-label>
                  <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" placeholder="Create a strong password" />
                  <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="signupForm.get('password')?.hasError('required')">
                    Password is required
                  </mat-error>
                  <mat-error *ngIf="signupForm.get('password')?.hasError('minlength')">
                    Password must be at least 6 characters
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="form-field">
                  <mat-label>Confirm Password</mat-label>
                  <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirm your password" />
                  <button type="button" mat-icon-button matSuffix (click)="hidePassword = !hidePassword">
                    <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  <mat-error *ngIf="signupForm.get('confirmPassword')?.hasError('required')">
                    Please confirm your password
                  </mat-error>
                  <mat-error *ngIf="signupForm.hasError('passwordMismatch')">
                    Passwords do not match
                  </mat-error>
                </mat-form-field>

                <button 
                  mat-raised-button 
                  color="primary" 
                  class="submit-btn"
                  [disabled]="signupForm.invalid || loading">
                  <mat-icon *ngIf="!loading">person_add</mat-icon>
                  <span>{{ loading ? 'Creating Account...' : 'Create Account' }}</span>
                </button>
              </form>

              <p class="terms">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </mat-tab>
        </mat-tab-group>

        <button mat-button class="back-home" (click)="goHome()">
          <mat-icon>arrow_back</mat-icon>
          Back to Home
        </button>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      width: 100%;
      animation: slideUp 0.5s ease-out;
      overflow: hidden;
    }

    .auth-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }

    .header-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    .auth-header h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .auth-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }

    .auth-tabs {
      padding: 32px 24px;
    }

    .tab-content {
      animation: fadeIn 0.4s ease-out;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-field {
      width: 100%;
    }

    mat-form-field {
      width: 100%;
    }

    .submit-btn {
      padding: 12px 24px !important;
      font-size: 1rem !important;
      border-radius: 8px !important;
      font-weight: 600;
      margin-top: 12px;
    }

    .submit-btn mat-icon {
      margin-right: 8px;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 24px 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: #ecf0f1;
    }

    .divider span {
      background: white;
      padding: 0 12px;
      color: #7f8c8d;
      font-size: 0.9rem;
      position: relative;
    }

    .guest-btn {
      padding: 12px 24px !important;
      border: 2px solid #ecf0f1 !important;
      color: #667eea !important;
      font-weight: 600;
      border-radius: 8px !important;
    }

    .guest-btn mat-icon {
      margin-right: 8px;
    }

    .demo-users {
      background: #f8f9fa;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #2c3e50;
      margin-top: 16px;
      line-height: 1.6;
      border-left: 3px solid #667eea;
    }

    .demo-users strong {
      color: #667eea;
    }

    .terms {
      font-size: 0.85rem;
      color: #7f8c8d;
      text-align: center;
      margin-top: 16px;
      line-height: 1.5;
    }

    .back-home {
      width: 100%;
      border-top: 1px solid #ecf0f1;
      margin-top: 0;
      color: #667eea !important;
      border-radius: 0 !important;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Material Overrides */
    ::ng-deep .auth-tabs .mat-mdc-tab-label {
      min-width: auto !important;
      padding: 0 32px !important;
    }

    ::ng-deep .auth-tabs .mdc-tab__content {
      padding: 24px 0 !important;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .auth-card {
        border-radius: 12px;
      }

      .auth-header {
        padding: 32px 16px;
      }

      .auth-header h1 {
        font-size: 1.5rem;
      }

      .auth-tabs {
        padding: 24px 16px;
      }
    }
  `]
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup;
  signupForm!: FormGroup;
  loading = false;
  hidePassword = true;
  selectedTabIndex = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Check query params to determine which tab to show
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'signup') {
        this.selectedTabIndex = 1;
      } else {
        this.selectedTabIndex = 0;
      }
    });
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signupForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: any } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.loginForm.reset();
    this.signupForm.reset();
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    // Mock login - in real app, call auth service
    setTimeout(() => {
      this.loading = false;
      // Store auth info
      localStorage.setItem('user', JSON.stringify({ email, role: 'CUSTOMER' }));
      this.snackBar.open('Login successful! Welcome back.', 'Close', { duration: 3000 });
      this.router.navigate(['/']);
    }, 1000);
  }

  onSignup(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    const { username, email, password } = this.signupForm.value;

    // Mock signup - in real app, call auth service
    setTimeout(() => {
      this.loading = false;
      // Store auth info
      localStorage.setItem('user', JSON.stringify({ username, email, role: 'CUSTOMER' }));
      this.snackBar.open('Account created successfully! Welcome to ShopHub.', 'Close', { duration: 3000 });
      this.router.navigate(['/']);
    }, 1000);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
