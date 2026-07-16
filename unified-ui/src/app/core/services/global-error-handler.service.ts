import { ErrorHandler, Injectable } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * GlobalErrorHandler — catches all unhandled exceptions, logs them to the
 * console, and surfaces a user-friendly error notification.
 * Requirements: 13.1, 13.5, 13.7
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private notificationService: NotificationService) {}

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[MyIndianStore] Unhandled error:', error);
    this.notificationService.show(
      'An unexpected error occurred. Please refresh the page.',
      'error'
    );
  }
}
