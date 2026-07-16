/**
 * Authentication data models for MyIndianStore Unified UI.
 * Requirements: 1.6, 1.7, 8.1, 8.2, 8.3, 8.4, 8.5
 */

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'GUEST';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface Notification {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}
