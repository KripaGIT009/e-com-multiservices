import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedEntry } from '../../models';
import { AdminAnalyticsService } from '../../services/admin-analytics.service';

/**
 * Displays a scrollable list of recent audit log entries.
 * Shows admin username, action type, entity, and relative timestamp.
 * Limits to 20 entries with most recent first.
 * Requirements: 10.1, 10.2
 */
@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
})
export class ActivityFeedComponent implements OnInit {
  entries: ActivityFeedEntry[] = [];
  isLoading = true;
  hasError = false;

  constructor(private analyticsService: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadActivityFeed();
  }

  private loadActivityFeed(): void {
    this.isLoading = true;
    this.hasError = false;

    this.analyticsService.getActivityFeed().subscribe({
      next: (data) => {
        this.entries = data.slice(0, 20);
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      },
    });
  }

  retry(): void {
    this.loadActivityFeed();
  }

  getActionBadgeClass(action: string): string {
    switch (action.toUpperCase()) {
      case 'CREATE':
        return 'badge--create';
      case 'UPDATE':
        return 'badge--update';
      case 'DELETE':
        return 'badge--delete';
      case 'VIEW':
        return 'badge--view';
      default:
        return 'badge--view';
    }
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();

    if (diffMs < 0) {
      return 'just now';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffWeeks < 5) {
      return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
    } else {
      return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
    }
  }
}
