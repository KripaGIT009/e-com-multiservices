import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-page">

      <!-- Logo -->
      <div class="auth-logo" (click)="router.navigate(['/'])">
        <span class="logo-text">🛍️ My Indian Store</span>
      </div>

      <!-- Card -->
      <div class="auth-card">

        <!-- ── LOGIN ── -->
        <ng-container *ngIf="view==='login'">
          <h2 class="card-title">Sign in</h2>

          <div class="error-box" *ngIf="errorMsg">{{ errorMsg }}</div>

          <form [formGroup]="loginForm" (ngSubmit)="onLogin()">
            <div class="field">
              <label>Email or username</label>
              <input formControlName="username" type="text" autocomplete="username" />
              <div class="field-err" *ngIf="loginForm.get('username')?.touched && loginForm.get('username')?.invalid">
                Enter your email or username
              </div>
            </div>
            <div class="field">
              <label>Password <a class="forgot" href="#">Forgot password?</a></label>
              <input formControlName="password" [type]="showPwd ? 'text' : 'password'" autocomplete="current-password" />
              <button type="button" class="show-pwd" (click)="showPwd=!showPwd">{{ showPwd ? 'Hide' : 'Show' }}</button>
              <div class="field-err" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid">
                Enter your password
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <p class="terms">
            By continuing, you agree to My Indian Store's
            <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
          </p>

          <div class="divider"><span>New to My Indian Store?</span></div>

          <button class="btn-secondary" (click)="switchToRegister()">Create your account</button>
        </ng-container>

        <!-- ── REGISTER ── -->
        <ng-container *ngIf="view==='register'">
          <h2 class="card-title">Create account</h2>

          <div class="error-box" *ngIf="errorMsg">{{ errorMsg }}</div>

          <form [formGroup]="registerForm" (ngSubmit)="onCustomerRegister()">
            <div class="field">
              <label>Your name</label>
              <input formControlName="username" type="text" placeholder="First and last name" />
              <div class="field-err" *ngIf="registerForm.get('username')?.touched && registerForm.get('username')?.invalid">
                Enter your name
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input formControlName="email" type="email" />
              <div class="field-err" *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid">
                Enter a valid email
              </div>
            </div>
            <div class="field">
              <label>Password</label>
              <input formControlName="password" [type]="showPwd ? 'text' : 'password'" />
              <button type="button" class="show-pwd" (click)="showPwd=!showPwd">{{ showPwd ? 'Hide' : 'Show' }}</button>
              <div class="field-err" *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid">
                Minimum 6 characters required
              </div>
            </div>
            <div class="field">
              <label>Re-enter password</label>
              <input formControlName="confirmPassword" [type]="showPwd ? 'text' : 'password'" />
              <div class="field-err" *ngIf="registerForm.hasError('mismatch') && registerForm.get('confirmPassword')?.touched">
                Passwords must match
              </div>
            </div>
            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Creating…' : 'Continue' }}
            </button>
          </form>

          <p class="terms">
            By creating an account, you agree to My Indian Store's
            <a href="#">Conditions of Use</a> and <a href="#">Privacy Notice</a>.
          </p>

          <div class="divider"><span>Already have an account?</span></div>
          <button class="btn-secondary" (click)="switchToLogin()">Sign in</button>
        </ng-container>

      </div>

      <!-- Footer -->
      <div class="auth-footer">
        <a href="#">Conditions of Use</a>
        <a href="#">Privacy Notice</a>
        <a href="#">Help</a>
        <p>© 2025 My Indian Store</p>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .auth-page {
      min-height: 100vh;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Arial, sans-serif;
    }

    /* Logo */
    .auth-logo {
      padding: 20px 0 16px;
      cursor: pointer;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: #131921;
    }

    /* Card */
    .auth-card {
      width: 100%;
      max-width: 348px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 24px;
      background: #fff;
    }

    /* Title */
    .card-title {
      font-size: 24px;
      font-weight: 400;
      color: #111;
      margin-bottom: 16px;
    }

    /* Error box */
    .error-box {
      background: #fff8f0;
      border: 1px solid #c7511f;
      border-left: 4px solid #c7511f;
      border-radius: 4px;
      padding: 10px 12px;
      font-size: 13px;
      color: #c7511f;
      margin-bottom: 16px;
    }

    /* Fields */
    .field {
      margin-bottom: 14px;
      position: relative;
    }
    .field label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-weight: 700;
      color: #111;
      margin-bottom: 4px;
    }
    .field input {
      width: 100%;
      height: 36px;
      padding: 4px 8px;
      border: 1px solid #888;
      border-radius: 3px;
      font-size: 13px;
      outline: none;
      background: #fff;
    }
    .field input:focus {
      border-color: #e77600;
      box-shadow: 0 0 0 3px rgba(228,121,17,0.25);
    }
    .show-pwd {
      position: absolute;
      right: 8px;
      bottom: 8px;
      background: none;
      border: none;
      font-size: 12px;
      color: #0066c0;
      cursor: pointer;
    }
    .show-pwd:hover { text-decoration: underline; color: #c7511f; }
    .forgot { font-size: 12px; color: #0066c0; text-decoration: none; font-weight: 400; }
    .forgot:hover { text-decoration: underline; color: #c7511f; }
    .field-err { font-size: 12px; color: #c7511f; margin-top: 4px; }

    /* Buttons */
    .btn-primary {
      width: 100%;
      height: 36px;
      background: linear-gradient(to bottom, #f7dfa5, #f0c14b);
      border: 1px solid #a88734;
      border-radius: 3px;
      font-size: 13px;
      font-weight: 600;
      color: #111;
      cursor: pointer;
      margin-top: 4px;
      transition: background 0.15s;
    }
    .btn-primary:hover:not(:disabled) { background: linear-gradient(to bottom, #f5d78e, #eeb933); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-secondary {
      width: 100%;
      height: 36px;
      background: linear-gradient(to bottom, #f7f8fa, #e7e9ec);
      border: 1px solid #adb1b8;
      border-radius: 3px;
      font-size: 13px;
      color: #111;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: linear-gradient(to bottom, #e7e9ec, #d9dce1); }

    /* Terms */
    .terms {
      font-size: 11px;
      color: #555;
      margin-top: 12px;
      line-height: 1.5;
    }
    .terms a { color: #0066c0; text-decoration: none; }
    .terms a:hover { text-decoration: underline; color: #c7511f; }

    /* Divider */
    .divider {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px 0 12px;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e7e7e7;
    }
    .divider span { font-size: 12px; color: #767676; white-space: nowrap; }

    /* Footer */
    .auth-footer {
      margin-top: 24px;
      padding: 16px;
      border-top: 1px solid #ddd;
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      font-size: 12px;
    }
    .auth-footer a { color: #0066c0; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; color: #c7511f; }
    .auth-footer p { width: 100%; text-align: center; color: #767676; }
  `]
})
export class AuthComponent implements OnInit {
  view: 'login' | 'register' = 'login';
  loading = false;
  errorMsg = '';
  showPwd = false;

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.pwdMatch });

    this.route.queryParams.subscribe(p => {
      if (p['type'] === 'signup') this.view = 'register';
    });
  }

  switchToRegister(): void { this.view = 'register'; this.errorMsg = ''; }
  switchToLogin(): void    { this.view = 'login';    this.errorMsg = ''; }

  private pwdMatch(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true };
  }

  /** Unified login: try user-service first; on 401 fall back to admin-service. */
  onLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.user?.role || '';
        if (role === 'ADMIN') {
          window.location.href = '/admin/';
        } else {
          this.router.navigate(['/']);
        }
      },
      error: () => {
        // User not found in user-service — try admin-service
        this.http.post<any>('/api/auth/admin-login', { username, password }).subscribe({
          next: (res) => {
            this.loading = false;
            // Store under both keys: 'token' (storefront) and 'auth_token' (admin UI)
            localStorage.setItem('token', res.token);
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('username', res.user?.username || username);
            localStorage.setItem('userRole', res.user?.role || 'ADMIN');
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('user', JSON.stringify({ username: res.user?.username || username, role: res.user?.role || 'ADMIN' }));
            window.location.href = res.redirectUrl || '/admin/';
          },
          error: () => {
            this.loading = false;
            this.errorMsg = 'Invalid email or password. Please try again.';
          }
        });
      }
    });
  }

  onCustomerRegister(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { username, email, password } = this.registerForm.value;
    this.authService.signup(username, email, password).subscribe({
      next: () => { this.loading = false; this.router.navigate(['/']); },
      error: (e) => {
        this.loading = false;
        this.errorMsg = e.error?.error || 'Registration failed. Please try again.';
      }
    });
  }
}
