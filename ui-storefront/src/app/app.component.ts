import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span>Storefront</span>
      <span class="spacer"></span>
      <button mat-icon-button routerLink="/">
        <mat-icon>home</mat-icon>
      </button>
      <button mat-icon-button routerLink="/products">
        <mat-icon>shopping_cart</mat-icon>
      </button>
    </mat-toolbar>
    <main class="container mt-3">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 15px;
    }
    .mt-3 {
      margin-top: 1.5rem;
    }
  `]
})
export class AppComponent {
  title = 'ui-storefront';
}
