import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { REASON_LABELS } from '../../models';

/** Chip naming why a courier was chosen: MANUAL / RULE / DEFAULT / STRATEGY / NONE. */
@Component({
  selector: 'app-allocation-reason',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="chip" [ngClass]="'chip--' + (reason || 'NONE').toLowerCase()"
    [attr.title]="reason">{{ label }}<ng-container *ngIf="ruleName">: {{ ruleName }}</ng-container></span>`,
  styles: [`
    .chip {
      display: inline-block; padding: 2px 9px; border-radius: 999px; white-space: nowrap;
      font-size: 0.75rem; font-weight: 600; background: var(--mis-line); color: var(--mis-ink-muted);
    }
    .chip--manual { background: var(--mis-accent-tint); color: #9F1239; }
    .chip--rule { background: var(--mis-chrome-tint); color: var(--mis-primary-dark); }
    .chip--default { background: #E6F4EA; color: #1B5E20; }
    .chip--strategy { background: #E3F2FD; color: #1565C0; }
    .chip--none { background: #FEF3C7; color: #92700E; }
  `],
})
export class AllocationReasonComponent {
  @Input() reason: string | null | undefined = null;
  @Input() ruleName: string | null | undefined = null;

  get label(): string {
    const key = (this.reason || 'NONE') as keyof typeof REASON_LABELS;
    return REASON_LABELS[key] || this.reason || 'No courier';
  }
}
