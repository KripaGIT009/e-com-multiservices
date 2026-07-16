import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * JwtInterceptor — attaches Authorization header to /api/ requests
 * and handles HTTP error responses with appropriate notifications.
 *
 * Requirements: 8.2, 8.5, 13.1, 13.6
 *
 * Error handling:
 * - 401: Attempt token refresh once; on failure logout and redirect to /login?reason=session_expired
 * - 403: Notification "You don't have permission to perform this action."
 * - 404: Notification "The requested resource was not found."
 * - 5xx: Notification "Something went wrong. Please try again later."
 * - Network error (status 0): Notification "Unable to connect. Please check your internet connection."
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    let authReq = req;

    // Only attach token for /api/ requests
    if (req.url.startsWith('/api/')) {
      const token = this.authService.getToken();
      if (token) {
        authReq = this.addTokenToRequest(req, token);
      }
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          // Network error — no connectivity
          this.notificationService.show(
            'Unable to connect. Please check your internet connection.',
            'error'
          );
          return throwError(() => error);
        }

        if (error.status === 401) {
          return this.handle401Error(authReq, next);
        }

        if (error.status === 403) {
          this.notificationService.show(
            "You don't have permission to perform this action.",
            'error'
          );
          return throwError(() => error);
        }

        if (error.status === 404) {
          this.notificationService.show(
            'The requested resource was not found.',
            'error'
          );
          return throwError(() => error);
        }

        if (error.status >= 500) {
          this.notificationService.show(
            'Something went wrong. Please try again later.',
            'error'
          );
          return throwError(() => error);
        }

        return throwError(() => error);
      })
    );
  }

  private handle401Error(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token);
          // Retry the original request with the new token
          return next.handle(this.addTokenToRequest(req, response.token));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.authService.logout();
          this.router.navigate(['/login'], {
            queryParams: { reason: 'session_expired' },
          });
          return throwError(() => refreshError);
        })
      );
    }

    // If a refresh is already in progress, queue this request
    // and retry once the new token is available
    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        return next.handle(this.addTokenToRequest(req, token!));
      })
    );
  }

  private addTokenToRequest(
    req: HttpRequest<unknown>,
    token: string
  ): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
