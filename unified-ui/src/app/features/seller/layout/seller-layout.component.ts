import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SellerPortalService, Seller } from '../seller.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** Requires an approved account. */
  gated?: boolean;
}

@Component({
  selector: 'app-seller-layout',
  templateUrl: './seller-layout.component.html',
  styleUrls: ['./seller-layout.component.scss'],
})
export class SellerLayoutComponent implements OnInit {
  seller: Seller | null = null;
  navOpen = false;

  readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/seller/dashboard' },
    { label: 'Products', icon: 'inventory_2', route: '/seller/products' },
    { label: 'Orders', icon: 'receipt_long', route: '/seller/orders', gated: true },
    { label: 'Delivery partners', icon: 'local_shipping', route: '/seller/delivery' },
    { label: 'Account', icon: 'store', route: '/seller/account' },
  ];

  constructor(
    private portal: SellerPortalService,
    private authService: AuthService,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.portal.me().subscribe({
      next: (s) => (this.seller = s),
      error: () => this.notify.show('Could not load your seller profile.', 'error'),
    });
  }

  get isApproved(): boolean {
    return this.seller?.status === 'APPROVED';
  }

  get statusLabel(): string {
    switch (this.seller?.status) {
      case 'APPROVED': return 'Approved';
      case 'PENDING_APPROVAL': return 'Awaiting approval';
      case 'REJECTED': return 'Rejected';
      case 'SUSPENDED': return 'Suspended';
      default: return '';
    }
  }

  get statusTone(): string {
    switch (this.seller?.status) {
      case 'APPROVED': return 'is-ok';
      case 'PENDING_APPROVAL': return 'is-wait';
      default: return 'is-stop';
    }
  }

  signOut(): void {
    this.authService.logout();
    this.router.navigate(['/seller/login']);
  }
}
