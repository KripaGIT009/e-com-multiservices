import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map((isAuthenticated) => {
        if (isAuthenticated) {
          return true;
        }
        // Send them to the sign-in for the realm they were trying to reach; a
        // seller's credentials do not work on the customer login.
        // Straight to the real route: routing via '/login' would redirect, and
        // redirectTo drops query params, losing the returnUrl.
        const loginRoute = state.url.startsWith('/seller') ? '/seller/login' : '/auth/login';
        this.router.navigate([loginRoute], { queryParams: { returnUrl: state.url } });
        return false;
      })
    );
  }
}
