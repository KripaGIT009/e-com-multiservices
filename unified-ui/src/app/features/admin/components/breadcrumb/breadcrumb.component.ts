import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbSegment {
  label: string;
  routerLink?: string | string[];
}

/**
 * Reusable breadcrumb navigation component.
 * Renders clickable links for parent segments and plain text for the current (last) segment.
 * Requirements: 6.1, 9.1
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input() segments: BreadcrumbSegment[] = [];

  isLastSegment(index: number): boolean {
    return index === this.segments.length - 1;
  }
}
