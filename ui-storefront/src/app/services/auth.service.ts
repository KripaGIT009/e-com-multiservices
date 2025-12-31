import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  username?: string;
  userId?: string;
  email?: string;
  role?: string;
  message?: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8004/users'; // User Service at port 8004
  private adminApiUrl = 'http://localhost:8011/api/admin'; // Admin Service
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCurrentUser();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };
    
    // Call the login endpoint on User Service (port 8004)
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        if (response.token || response.userId) {
          // Store user info in localStorage
          localStorage.setItem('userId', response.userId || email);
          localStorage.setItem('username', response.username || email);
          localStorage.setItem('userEmail', response.email || email);
          localStorage.setItem('userRole', response.role || 'CUSTOMER');
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          localStorage.setItem('user', JSON.stringify({
            userId: response.userId,
            username: response.username,
            email: response.email,
            role: response.role
          }));
          this.currentUserSubject.next({
            userId: response.userId,
            username: response.username,
            email: response.email,
            role: response.role
          });
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  adminLogin(username: string, password: string): Observable<LoginResponse> {
    const request = { username, password };
    
    return this.http.post<LoginResponse>(`${this.adminApiUrl}/login`, request).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.username || 'admin');
          localStorage.setItem('username', response.username || 'admin');
          localStorage.setItem('userRole', response.role || 'ADMIN');
          localStorage.setItem('isAdmin', 'true');
          this.currentUserSubject.next({
            username: response.username,
            role: response.role,
            isAdmin: true
          });
        }
      }),
      catchError(error => {
        console.error('Admin login error:', error);
        throw error;
      })
    );
  }

  signup(username: string, email: string, password: string): Observable<any> {
    const request: SignupRequest = { username, email, password };
    
    return this.http.post<any>(`${this.apiUrl}`, {
      username,
      email,
      password,
      firstName: username,
      lastName: '',
      role: 'CUSTOMER'
    }).pipe(
      tap(response => {
        console.log('Signup successful:', response);
        // After signup, store the user info
        localStorage.setItem('userId', response.id || email);
        localStorage.setItem('username', response.username || username);
        localStorage.setItem('userEmail', response.email || email);
        localStorage.setItem('userRole', 'CUSTOMER');
        this.currentUserSubject.next({
          userId: response.id,
          username: response.username,
          email: response.email,
          role: 'CUSTOMER'
        });
      }),
      catchError(error => {
        console.error('Signup error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
  }
}
