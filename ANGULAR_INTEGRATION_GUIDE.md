# Frontend Integration Guide - Centralized Login

This guide shows how to integrate the centralized login system with Angular/TypeScript UIs.

## 1. Angular Auth Service

Create `src/app/services/auth.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  user: any;
  redirectUrl: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authApiUrl = '/api/auth'; // BFF will proxy to ui-auth
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadCurrentUser();
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Redirect to appropriate page based on role
          if (response.redirectUrl) {
            window.location.href = response.redirectUrl;
          }
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        throw error;
      })
    );
  }

  /**
   * Register a new user
   */
  register(user: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.authApiUrl}/register`, user).pipe(
      tap(response => {
        if (response.token) {
          this.setToken(response.token);
          this.currentUserSubject.next(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Redirect to appropriate page based on role
          if (response.redirectUrl) {
            window.location.href = response.redirectUrl;
          }
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.http.post(`${this.authApiUrl}/logout`, {}).pipe(
      tap(() => {
        this.removeToken();
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      })
    );
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Set token in localStorage
   */
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Remove token from localStorage
   */
  private removeToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Load current user from localStorage
   */
  private loadCurrentUser(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  /**
   * Verify token with backend
   */
  verifyToken(): Observable<any> {
    return this.http.get(`${this.authApiUrl}/verify`).pipe(
      catchError(error => {
        this.removeToken();
        throw error;
      })
    );
  }

  /**
   * Get user role
   */
  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.role || 'GUEST';
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }
}
```

## 2. HTTP Interceptor with Token

Create `src/app/interceptors/auth.interceptor.ts`:

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    
    const token = this.authService.getToken();
    
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Token invalid or expired
          this.authService.logout().subscribe();
          window.location.href = 'http://localhost:4200';
        }
        return throwError(() => error);
      })
    );
  }
}
```

## 3. Auth Guard

Create `src/app/guards/auth.guard.ts`:

```typescript
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateChild,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (this.authService.isLoggedIn()) {
      const requiredRole = route.data['role'];
      
      if (requiredRole && !this.authService.hasRole(requiredRole)) {
        // User doesn't have required role
        this.router.navigate(['/unauthorized']);
        return false;
      }
      
      return true;
    }

    // Not logged in, redirect to login
    window.location.href = 'http://localhost:4200';
    return false;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    return this.canActivate(route, state) as boolean;
  }
}
```

## 4. Login Component

Create `src/app/components/login/login.component.ts`:

```typescript
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(
      this.f['username'].value,
      this.f['password'].value
    ).subscribe({
      next: () => {
        // Redirect happens in service
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.error || 'Login failed';
      }
    });
  }
}
```

Create `src/app/components/login/login.component.html`:

```html
<div class="login-container">
  <div class="login-card">
    <h2>Login</h2>
    
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          formControlName="username"
          class="form-control"
          [ngClass]="{ 'is-invalid': submitted && f['username'].errors }"
          placeholder="Enter username"
        />
        <div *ngIf="submitted && f['username'].errors" class="error-message">
          Username is required
        </div>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          class="form-control"
          [ngClass]="{ 'is-invalid': submitted && f['password'].errors }"
          placeholder="Enter password"
        />
        <div *ngIf="submitted && f['password'].errors" class="error-message">
          Password is required
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

      <button
        type="submit"
        class="btn btn-primary"
        [disabled]="loading"
      >
        <span *ngIf="!loading">Sign In</span>
        <span *ngIf="loading">Signing in...</span>
      </button>
    </form>

    <p class="text-center mt-3">
      New user? <a routerLink="/register">Create account</a>
    </p>
  </div>
</div>
```

## 5. Module Setup

Update `src/app/app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AuthGuard } from './guards/auth.guard';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## 6. Routing with Guards

Update `src/app/app-routing.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' }
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

## 7. User Profile Component with Logout

Create `src/app/components/user-profile/user-profile.component.ts`:

```typescript
import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  currentUser$ = this.authService.currentUser$;

  constructor(private authService: AuthService) { }

  logout() {
    this.authService.logout().subscribe();
  }
}
```

Create `src/app/components/user-profile/user-profile.component.html`:

```html
<div class="user-profile" *ngIf="currentUser$ | async as user">
  <div class="profile-header">
    <h3>{{ user.firstName }} {{ user.lastName }}</h3>
    <span class="badge" [ngClass]="'badge-' + user.role.toLowerCase()">
      {{ user.role }}
    </span>
  </div>
  
  <div class="profile-info">
    <p><strong>Username:</strong> {{ user.username }}</p>
    <p><strong>Email:</strong> {{ user.email }}</p>
  </div>

  <button class="btn btn-danger" (click)="logout()">Logout</button>
</div>
```

## 8. Backend Proxy in BFF

Each UI's BFF (Backend for Frontend) should proxy auth requests:

```typescript
// In ui-account/routes/auth.js (or similar)
router.post('/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE}/api/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data);
  }
});

router.get('/verify', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE}/api/auth/verify`, {
      headers: req.headers
    });
    res.json(response.data);
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});
```

## Usage Examples

### Example 1: Protected Component
```typescript
@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent {
  constructor(private authService: AuthService) {
    if (!this.authService.hasRole('ADMIN')) {
      // Redirect or show error
    }
  }
}
```

### Example 2: Conditional Rendering
```html
<button *ngIf="(authService.currentUser$ | async) as user; else loginButton">
  Logout {{ user.firstName }}
</button>

<ng-template #loginButton>
  <a routerLink="/login">Login</a>
</ng-template>
```

### Example 3: Role-Based Menu
```html
<ul class="menu">
  <li routerLink="/dashboard">Dashboard</li>
  <li *ngIf="authService.hasRole('ADMIN')" routerLink="/admin">
    Admin Panel
  </li>
  <li *ngIf="authService.hasRole('CUSTOMER')" routerLink="/orders">
    My Orders
  </li>
</ul>
```

## API Service Example

```typescript
// src/app/services/user.service.ts
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) { }

  getProfile(): Observable<User> {
    return this.http.get<User>('/api/profile');
    // Interceptor will add Authorization header
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>('/api/profile', user);
  }
}
```

## Testing

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login and store token', () => {
    const mockResponse = {
      token: 'test-token',
      user: { id: 1, username: 'admin', role: 'ADMIN' },
      redirectUrl: 'http://localhost:3000'
    };

    service.login('admin', 'password123').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.getToken()).toBe('test-token');
    expect(service.isLoggedIn()).toBe(true);
  });
});
```

---

**Frontend Integration Complete!** 🎉

Now your Angular UIs are fully integrated with the centralized login system.
