import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginResponse {
  token?: string;
  user?: { id: any; username: string; email: string; role: string };
  // legacy fields kept for compatibility
  username?: string;
  userId?: string;
  email?: string;
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  // ── Customer login via BFF ──────────────────────────────────────────────────
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      tap(res => this.storeSession(res)),
      catchError(err => { throw err; })
    );
  }

  // ── Customer register via BFF ───────────────────────────────────────────────
  signup(username: string, email: string, password: string, firstName = '', lastName = ''): Observable<any> {
    return this.http.post<any>('/api/auth/register', { username, email, password, firstName, lastName }).pipe(
      tap(res => this.storeSession(res)),
      catchError(err => { throw err; })
    );
  }

  // ── Admin login — goes directly to admin-service ────────────────────────────
  adminLogin(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('http://localhost:8011/api/admin/login', { username, password }).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('userRole', 'ADMIN');
          localStorage.setItem('isAdmin', 'true');
          this.currentUserSubject.next({ username, role: 'ADMIN' });
          // Redirect to admin UI
          window.location.href = 'http://localhost:3000';
        }
      }),
      catchError(err => { throw err; })
    );
  }

  logout(): void {
    ['token','userId','username','userEmail','userRole','user','isAdmin'].forEach(k => localStorage.removeItem(k));
    this.currentUserSubject.next(null);
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAuthenticated(): boolean { return this.isLoggedIn(); }
  getCurrentUser(): any { return this.currentUserSubject.value; }

  private storeSession(res: LoginResponse): void {
    const user = res.user || { id: res.userId, username: res.username, email: res.email, role: res.role || 'CUSTOMER' };
    if (res.token) localStorage.setItem('token', res.token);
    localStorage.setItem('userId',    String(user.id   || ''));
    localStorage.setItem('username',  user.username || '');
    localStorage.setItem('userEmail', user.email    || '');
    localStorage.setItem('userRole',  user.role     || 'CUSTOMER');
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
    window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: user }));
  }

  private loadCurrentUser(): void {
    try {
      const raw = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (raw) {
        const user = JSON.parse(raw);
        const resolvedUser = {
          ...user,
          id: user?.id || user?.userId || this.extractUserIdFromToken(token)
        };
        if (resolvedUser.id) {
          localStorage.setItem('userId', String(resolvedUser.id));
        }
        this.currentUserSubject.next(resolvedUser);
        return;
      }

      const tokenUserId = this.extractUserIdFromToken(token);
      if (tokenUserId) {
        localStorage.setItem('userId', String(tokenUserId));
        this.currentUserSubject.next({ id: tokenUserId });
      }
    } catch (_) {}
  }

  private extractUserIdFromToken(token: string | null): string | null {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.id ? String(payload.id) : null;
    } catch (_) {
      return null;
    }
  }
}
