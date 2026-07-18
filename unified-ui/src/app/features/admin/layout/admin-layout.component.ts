import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { AuthUser } from '@core/models/auth.models';
import { AdminTopBarComponent } from './admin-top-bar/admin-top-bar.component';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';

/**
 * AdminLayoutComponent
 *
 * Shell component that wraps all /admin/* routes with a CSS Grid layout
 * containing a top bar, collapsible sidebar, and content area with a
 * nested <router-outlet> for child page rendering.
 *
 * Responsive behavior:
 * - ≥1024px: sidebar expanded with icons and text labels
 * - 768–1023px: sidebar collapsed to icons only (auto-collapsed)
 * - <768px: sidebar hidden, accessible via hamburger menu toggle
 *
 * Requirements: 3.1, 3.5, 3.6, 11.1, 11.2, 11.3
 * Integrates AdminTopBarComponent and AdminSidebarComponent
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminTopBarComponent, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  mobileOpen = false;
  currentUser: AuthUser | null = null;

  private readonly BREAKPOINT_TABLET = 1024;
  private readonly BREAKPOINT_MOBILE = 768;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.applyResponsiveState(window.innerWidth);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    this.applyResponsiveState(width);
  }

  onSidebarToggle(): void {
    if (window.innerWidth < this.BREAKPOINT_MOBILE) {
      // Mobile: toggle overlay sidebar
      this.mobileOpen = !this.mobileOpen;
    } else {
      // Desktop/Tablet: toggle collapsed state
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  onMobileOverlayClick(): void {
    this.mobileOpen = false;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Applies responsive sidebar state based on viewport width.
   * - ≥1024px: expanded
   * - 768–1023px: collapsed (icons only)
   * - <768px: hidden (toggle via hamburger)
   */
  private applyResponsiveState(width: number): void {
    if (width >= this.BREAKPOINT_TABLET) {
      // Desktop: expanded
      this.sidebarCollapsed = false;
      this.mobileOpen = false;
    } else if (width >= this.BREAKPOINT_MOBILE) {
      // Tablet: collapsed to icons only
      this.sidebarCollapsed = true;
      this.mobileOpen = false;
    } else {
      // Mobile: hidden by default
      this.sidebarCollapsed = false;
      this.mobileOpen = false;
    }
  }
}
