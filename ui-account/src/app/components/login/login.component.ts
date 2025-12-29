import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, RouterModule],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="error" class="error-message">{{ error }}</div>

          <mat-form-field>
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="username" placeholder="Enter your username">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="password" placeholder="Enter your password">
          </mat-form-field>

          <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>

          <button mat-raised-button color="primary" (click)="login()" [disabled]="loading" class="full-width">
            Login
          </button>

          <p class="text-center mt-3">
            Don't have an account? <a href="/register">Register</a>
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 5rem auto;
    }
    mat-card {
      padding: 2rem;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1.5rem;
    }
    .full-width {
      width: 100%;
    }
    .error-message {
      color: #d32f2f;
      background-color: #ffebee;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .text-center {
      text-align: center;
    }
    .mt-3 {
      margin-top: 1.5rem;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService) { }

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password';
      return;
    }

    this.loading = true;
    this.error = null;
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.authService.setToken(response.token, this.username);
        window.location.href = '/profile';
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Invalid credentials. Please try again.';
      }
    });
  }
}
