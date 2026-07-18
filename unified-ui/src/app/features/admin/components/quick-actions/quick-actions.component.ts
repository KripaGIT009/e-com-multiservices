import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface QuickAction {
  label: string;
  path: string;
  icon: string;
}

/**
 * Quick action navigation links to admin management sub-pages.
 * Requirements: 15.1, 15.2
 */
@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
})
export class QuickActionsComponent {
  actions: QuickAction[] = [
    { label: 'Manage Orders', path: '/admin/orders', icon: '📦' },
    { label: 'Manage Users', path: '/admin/users', icon: '👥' },
    { label: 'Manage Products', path: '/admin/products', icon: '🏷️' },
    { label: 'View Returns', path: '/admin/returns', icon: '↩️' },
    { label: 'Audit Logs', path: '/admin/audit', icon: '📝' },
  ];
}
