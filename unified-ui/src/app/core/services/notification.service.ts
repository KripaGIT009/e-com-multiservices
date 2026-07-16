import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification } from '../models/auth.models';

/**
 * NotificationService — manages application-wide toast notifications.
 * Provides a reactive notification stream, supports show/dismiss operations,
 * and auto-dismisses notifications after 4 seconds.
 * Requirements: 13.1, 13.5, 13.6, 13.7
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  show(message: string, severity: Notification['severity']): void {
    const notification: Notification = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      message,
      severity,
      timestamp: Date.now(),
    };
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...current, notification]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => this.dismiss(notification.id), 4000);
  }

  dismiss(id: string): void {
    const current = this.notificationsSubject.getValue();
    this.notificationsSubject.next(current.filter((n) => n.id !== id));
  }
}
