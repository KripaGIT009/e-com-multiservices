import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('Interceptor called for:', req.url, 'Token exists:', !!token);

  // Don't add token to login endpoint
  if (req.url.includes('/admin/login')) {
    console.log('Skipping token for login endpoint');
    return next(req);
  }

  // Clone request and add authorization header if token exists
  if (token) {
    console.log('Adding Authorization header with Bearer token');
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  console.log('No token available, sending request without Authorization header');
  return next(req);
};
