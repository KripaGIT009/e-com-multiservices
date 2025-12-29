import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand" routerLink="/">
        <mat-icon class="logo-icon">shopping_bag</mat-icon>
        <span class="brand-name">ShopHub</span>
      </span>
      <span class="spacer"></span>
      <button mat-button class="nav-link" routerLink="/">Home</button>
      <button mat-button class="nav-link" routerLink="/products">Products</button>
      <button mat-icon-button [matMenuTriggerFor]="menu" matBadge="0" matBadgeColor="warn">
        <mat-icon>shopping_cart</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item>View Cart</button>
        <button mat-menu-item>Checkout</button>
      </mat-menu>
      <button mat-button class="auth-btn" (click)="openAuth('login')">
        <mat-icon>login</mat-icon> Login
      </button>
      <button mat-raised-button color="accent" class="auth-btn" (click)="openAuth('signup')">
        Sign Up
      </button>
    </mat-toolbar>

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.3rem;
    }

    .logo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .brand-name {
      color: white;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .nav-link {
      color: white !important;
      margin: 0 12px;
      font-weight: 500;
      transition: opacity 0.3s ease;
    }

    .nav-link:hover {
      opacity: 0.8;
    }

    .auth-btn {
      margin-left: 8px;
      color: white;
    }

    main {
      background: #f5f7fa;
      min-height: calc(100vh - 64px);
    }
  `]
})
export class AppComponent {
  title = 'ShopHub';

  constructor(private router: Router) {}

  openAuth(type: string): void {
    this.router.navigate(['/auth'], { queryParams: { type } });
  }
}
