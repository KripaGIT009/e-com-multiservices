import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1><mat-icon>subscriptions</mat-icon> Subscriptions</h1>
      <div class="empty-state">
        <mat-icon>subscriptions</mat-icon>
        <h2>No active subscriptions</h2>
        <p>Manage your recurring orders and subscriptions here</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { display: flex; align-items: center; gap: 12px; font-size: 32px; }
    .empty-state { text-align: center; padding: 80px 24px; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ccc; margin-bottom: 16px; }
  `]
})
export class SubscriptionsComponent {}
