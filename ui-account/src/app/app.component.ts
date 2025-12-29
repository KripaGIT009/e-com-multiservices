import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <span>Account</span>
      <span class="spacer"></span>
      <button mat-icon-button *ngIf="isLoggedIn()" (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
      <span *ngIf="isLoggedIn()" class="user-info">{{ username }}</span>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    main {
      padding: 2rem 0;
    }
    .user-info {
      margin-right: 1rem;
      font-size: 0.9rem;
    }
  `]
})
export class AppComponent implements OnInit {
  username = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || '';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
