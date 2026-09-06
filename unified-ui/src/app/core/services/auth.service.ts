import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, distinctUntilChanged } from 'rxjs/operators';

import {
  AuthState,
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserRole,
} from '../models/auth.models';

const TOKEN_KEY = 'mis_token';
const REFRESH_TOKEN_KEY = 'mis_refresh_token';
const USER_KEY = 'mis_user';

const initialState: AuthState = {
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private state$ = new BehaviorSubject<AuthState>(initialState);

  currentUser$: Observable<AuthUser | null> = this.state$.pipe(
    map((state) => state.user),
    distinctUntilChanged()
  );

  isAuthenticated$: Observable<boolean> = this.state$.pipe(
    map((state) => state.isAuthenticated),
    distinctUntilChanged()
  );

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.state$.next(initialState);
  }

  refreshToken(): Observable<AuthResponse> {
    const currentRefreshToken = this.state$.getValue().refreshToken;
    return this.http
      .post<AuthResponse>('/api/auth/refresh', { refreshToken: currentRefreshToken })
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (token && userJson) {
      try {
        const user: AuthUser = JSON.parse(userJson);
        this.state$.next({
          token,
          refreshToken,
          user,
          isAuthenticated: true,
        });
      } catch {
        // Invalid stored data — clear and stay unauthenticated
        this.logout();
      }
    }
  }

  get currentUser(): AuthUser | null {
    return this.state$.getValue().user;
  }

  getToken(): string | null {
    return this.state$.getValue().token;
  }

  getUserRole(): UserRole | null {
    const user = this.state$.getValue().user;
    return user ? user.role : null;
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    this.state$.next({
      token: response.token,
      refreshToken: response.refreshToken || null,
      user: response.user,
      isAuthenticated: true,
    });
  }
}
