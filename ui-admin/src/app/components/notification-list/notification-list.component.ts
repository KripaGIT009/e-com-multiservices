import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Notifications</mat-card-title>
        <button mat-raised-button color="primary" (click)="loadNotifications()" style="margin-left: auto;">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </mat-card-header>
      <mat-card-content>
        <mat-list *ngIf="notifications.length > 0; else noNotifications">
          <mat-list-item *ngFor="let notification of notifications">
            <mat-icon matListItemIcon>{{getChannelIcon(notification.channel)}}</mat-icon>
            <div matListItemTitle>{{notification.templateCode}}</div>
            <div matListItemLine>
              <mat-chip [color]="getStatusColor(notification.status)" selected>
                {{notification.status}}
              </mat-chip>
              <span style="margin-left: 10px;">{{notification.channel}}</span>
            </div>
            <div matListItemMeta>{{notification.sentAt | date: 'short'}}</div>
          </mat-list-item>
        </mat-list>

        <ng-template #noNotifications>
          <div style="text-align: center; padding: 40px;">
            <mat-icon style="font-size: 64px; height: 64px; width: 64px; color: #ccc;">notifications_none</mat-icon>
            <p>No notifications yet</p>
          </div>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 20px;
    }
    mat-card-header {
      display: flex;
      align-items: center;
    }
  `]
})
export class NotificationListComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.notificationService.getAllNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
      },
      error: () => {
        this.snackBar.open('Error loading notifications', 'Close', { duration: 3000 });
      }
    });
  }

  getChannelIcon(channel: string): string {
    switch (channel?.toUpperCase()) {
      case 'EMAIL':
        return 'email';
      case 'SMS':
        return 'sms';
      case 'PUSH':
        return 'notifications';
      case 'KAFKA':
        return 'message';
      default:
        return 'notifications';
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return 'primary';
      case 'PENDING':
        return 'accent';
      case 'FAILED':
      case 'SKIPPED':
        return 'warn';
      default:
        return '';
    }
  }
}
