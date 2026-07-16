import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/auth.models';

@Component({
  selector: 'app-notification-toast',
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.scss'],
})
export class NotificationToastComponent {
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  dismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  getIcon(severity: string): string {
    switch (severity) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }
}
