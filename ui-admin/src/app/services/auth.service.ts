import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const token = this.getToken();
      if (token) {
        this.loadUserFromToken(token);
      }
    }
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/admin/login`, request)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.token && this.isBrowser) {
            console.log('Storing token with key:', this.tokenKey);
            localStorage.setItem(this.tokenKey, response.token);
            console.log('Token stored. Verification:', localStorage.getItem(this.tokenKey) ? 'SUCCESS' : 'FAILED');
            this.currentUserSubject.next({
              username: response.username,
              role: response.role
            });
          }
        })
      );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
    }
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    const token = localStorage.getItem(this.tokenKey);
    console.log('getToken() called, key:', this.tokenKey, 'token exists:', !!token);
    return token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadUserFromToken(token: string): void {
    // Decode JWT token to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUserSubject.next({
        username: payload.sub,
        role: payload.role
      });
    } catch (error) {
      console.error('Error decoding token', error);
    }
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
