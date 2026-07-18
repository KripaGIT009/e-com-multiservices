import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface SidebarChildItem {
  label: string;
  icon: string;
  route: string;
}

export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: SidebarChildItem[];
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() logoutClicked = new EventEmitter<void>();

  constructor(private router: Router) {}

  /** Track which parent groups are expanded */
  expandedGroups: Set<string> = new Set();

  menuItems: SidebarMenuItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin' },
    {
      label: 'Manage Products',
      icon: 'inventory_2',
      children: [
        { label: 'Add Product', icon: 'add_circle', route: '/admin/products/add' },
        { label: 'All Products', icon: 'list', route: '/admin/products' },
      ]
    },
    {
      label: 'Manage Orders',
      icon: 'shopping_bag',
      children: [
        { label: 'Active Orders', icon: 'local_shipping', route: '/admin/orders/active' },
        { label: 'Closed Orders', icon: 'archive', route: '/admin/orders/closed' },
      ]
    },
    { label: 'Categories', icon: 'category', route: '/admin/categories' },
    { label: 'Reviews', icon: 'star_rate', route: '/admin/reviews' },
    { label: 'Earnings', icon: 'attach_money', route: '/admin/earnings' },
    { label: 'Payouts', icon: 'payments', route: '/admin/payouts' },
    { label: 'Store Settings', icon: 'settings', route: '/admin/settings' },
    { label: 'Profile', icon: 'person', route: '/admin/profile' },
  ];

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  onLogout(): void {
    this.logoutClicked.emit();
  }

  toggleGroup(label: string): void {
    if (this.expandedGroups.has(label)) {
      this.expandedGroups.delete(label);
    } else {
      this.expandedGroups.add(label);
    }
  }

  isGroupExpanded(label: string): boolean {
    return this.expandedGroups.has(label);
  }

  isGroupActive(item: SidebarMenuItem): boolean {
    if (!item.children) return false;
    const currentUrl = this.router.url;
    return item.children.some(child => currentUrl.startsWith(child.route));
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
