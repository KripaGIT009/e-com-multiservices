import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Admin top bar component displaying the store brand, notification bell,
 * hamburger menu toggle, and a profile dropdown with logout action.
 *
 * Requirements: 3.1, 4.1
 */
@Component({
  selector: 'app-admin-top-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-top-bar.component.html',
  styleUrls: ['./admin-top-bar.component.scss'],
})
export class AdminTopBarComponent {
  /** Display name of the logged-in user */
  @Input() userName = '';

  /** Store name displayed in the brand area */
  @Input() storeName = 'MyIndianStore';

  /** Emitted when the hamburger menu icon is clicked (mobile sidebar toggle) */
  @Output() sidebarToggle = new EventEmitter<void>();

  /** Emitted when the user clicks Logout in the profile dropdown */
  @Output() logoutClicked = new EventEmitter<void>();

  /** Count of unread notifications shown as a badge */
  notificationCount = 0;

  /** Whether the profile dropdown menu is currently visible */
  profileDropdownOpen = false;

  /** Toggle the sidebar via hamburger menu */
  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }

  /** Toggle profile dropdown visibility */
  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  /** Close profile dropdown (used for click-outside) */
  closeProfileDropdown(): void {
    this.profileDropdownOpen = false;
  }

  /** Handle logout action from profile dropdown */
  onLogout(): void {
    this.profileDropdownOpen = false;
    this.logoutClicked.emit();
  }
}
