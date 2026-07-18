import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Supported status badge variants.
 * Maps to color tokens defined in _variables.scss.
 */
export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'in-stock'
  | 'low-stock'
  | 'out-of-stock'
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'default';

/**
 * Reusable status badge component that displays a colored label
 * indicating the current state of an item.
 *
 * Uses BEM naming convention and design tokens from _variables.scss.
 * Includes aria-label for screen reader accessibility.
 *
 * Requirements: 10.2, 12.3
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  /** The display text shown inside the badge */
  @Input() text = '';

  /** The visual variant determining the badge color scheme */
  @Input() variant: StatusVariant = 'default';

  /** Context label for the aria-label (e.g., "Order", "Product", "Item") */
  @Input() label = 'Item';

  /** Computed CSS class based on the variant */
  get variantClass(): string {
    return `status-badge--${this.variant}`;
  }

  /** Computed aria-label for screen reader accessibility */
  get ariaLabel(): string {
    return `${this.label} status: ${this.text}`;
  }
}
