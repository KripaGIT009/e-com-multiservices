import { Component, Input } from '@angular/core';
import { UserRole } from '../../../core/models/auth.models';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Input() role: UserRole | null = null;

  get showAdminLinks(): boolean {
    return this.role === 'ADMIN';
  }

  get showCustomerLinks(): boolean {
    return this.role === 'CUSTOMER' || this.role === 'ADMIN';
  }
}
