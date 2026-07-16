import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const allowedRoles: UserRole[] = route.data['roles'] || [];
    const currentRole = this.authService.getUserRole();

    if (currentRole && allowedRoles.includes(currentRole)) {
      return true;
    }

    // Navigate to role-appropriate default route
    const defaultRoute = this.getDefaultRouteForRole(currentRole);
    this.router.navigate([defaultRoute]);
    return false;
  }

  private getDefaultRouteForRole(role: UserRole | null): string {
    switch (role) {
      case 'ADMIN':
        return '/admin';
      case 'CUSTOMER':
        return '/account';
      case 'GUEST':
      default:
        return '/home';
    }
  }
}
