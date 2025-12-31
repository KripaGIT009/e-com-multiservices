import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

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
    MatSnackBarModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="icon-container">
            <mat-icon class="header-icon">shopping_cart</mat-icon>
          </div>
          <h1>Welcome Back!</h1>
          <p>Sign in to save your cart and access exclusive deals</p>
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
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      max-width: 480px;
      width: 100%;
      animation: slideUp 0.5s ease-out;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .auth-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 48px 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .auth-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }

    .icon-container {
      background: rgba(255, 255, 255, 0.2);
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: white;
    }

    .auth-header h1 {
      margin: 0 0 12px 0;
      font-size: 2.2rem;
      font-weight: 700;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .auth-header p {
      margin: 0;
      opacity: 0.95;
      font-size: 1rem;
      position: relative;
      z-index: 1;
      max-width: 300px;
      margin: 0 auto;
      line-height: 1.5;
    }

    @keyframes pulse {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-10px, -10px) scale(1.1); }
    }

    .auth-tabs {
      padding: 40px 32px 32px;
    }

    .tab-content {
      animation: fadeIn 0.4s ease-out;
      padding-top: 24px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-field {
      width: 100%;
      margin: 0 !important;
    }

    ::ng-deep .auth-tabs mat-form-field {
      width: 100% !important;
      display: block !important;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: #f8f9fa !important;
    }

    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: rgba(102, 126, 234, 0.05) !important;
    }

    .submit-btn {
      padding: 16px 32px !important;
      font-size: 1.05rem !important;
      border-radius: 12px !important;
      font-weight: 600;
      margin-top: 16px;
      height: 56px !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35) !important;
      transition: all 0.3s ease !important;
      letter-spacing: 0.5px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.45) !important;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit-btn mat-icon {
      margin-right: 8px;
    }

    .divider {
      position: relative;
      text-align: center;
      margin: 28px 0;
    }

    .divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 100%;
      height: 1px;
      background: #e0e0e0;
    }

    .divider span {
      background: white;
      padding: 0 16px;
      color: #95a5a6;
      font-size: 0.9rem;
      position: relative;
      font-weight: 500;
    }

    .guest-btn {
      width: 100%;
      padding: 14px 24px !important;
      height: 52px !important;
      border: 2px solid #667eea !important;
      color: #667eea !important;
      font-weight: 600;
      border-radius: 12px !important;
      transition: all 0.3s ease !important;
      letter-spacing: 0.3px;
    }

    .guest-btn:hover {
      background: rgba(102, 126, 234, 0.08) !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2) !important;
    }

    .guest-btn mat-icon {
      margin-right: 8px;
    }

    .demo-users {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 16px 20px;
      border-radius: 12px;
      font-size: 0.875rem;
      color: #495057;
      margin-top: 20px;
      line-height: 1.8;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .demo-users strong {
      color: #667eea;
      font-weight: 700;
      display: block;
      margin-bottom: 8px;
    }

    .terms {
      font-size: 0.875rem;
      color: #95a5a6;
      text-align: center;
      margin-top: 20px;
      line-height: 1.6;
      padding: 0 8px;
    }

    .back-home {
      width: 100%;
      padding: 16px !important;
      border-top: 1px solid #e9ecef;
      margin-top: 0;
      color: #667eea !important;
      border-radius: 0 !important;
      font-weight: 600;
      transition: all 0.3s ease !important;
    }

    .back-home:hover {
      background: rgba(102, 126, 234, 0.05) !important;
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

      .form-field {
        margin-bottom: 8px !important;
      }

      form {
        gap: 16px;
      }
    }

    /* Ensure proper alignment across all screen sizes */
    ::ng-deep .mat-mdc-form-field-infix {
      padding: 12px 0 !important;
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
    private snackBar: MatSnackBar,
    private authService: AuthService
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

    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`✅ Welcome ${response.username || email}!`, 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Notify other components about login
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { userId: response.userId || email, username: response.username }
        }));
        
        // Redirect to home
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.message || error.message || 'Login failed. Please check your credentials.';
        this.snackBar.open(`❌ ${errorMessage}`, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Login error:', error);
      }
    });
  }

  onSignup(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    const { username, email, password } = this.signupForm.value;

    this.authService.signup(username, email, password).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open(`🎉 Account created! Welcome to My Indian Store.`, 'Close', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        // Notify other components about login
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { userId: response.id || email, username: response.username }
        }));
        
        // Redirect to home
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 500);
      },
      error: (error) => {
        this.loading = false;
        const errorMessage = error.error?.message || error.message || 'Signup failed. Please try again.';
        this.snackBar.open(`❌ ${errorMessage}`, 'Close', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        console.error('Signup error:', error);
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
