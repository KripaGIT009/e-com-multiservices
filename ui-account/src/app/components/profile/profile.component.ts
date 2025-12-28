import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="container">
      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>User Profile</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="error" class="error-message">{{ error }}</div>
          <div *ngIf="success" class="success-message">Profile updated successfully</div>

          <mat-spinner *ngIf="loading" diameter="40"></mat-spinner>

          <mat-form-field>
            <mat-label>Full Name</mat-label>
            <input matInput [(ngModel)]="profile.fullName" placeholder="Enter full name">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="profile.email" placeholder="Enter email">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Phone</mat-label>
            <input matInput [(ngModel)]="profile.phone" placeholder="Enter phone number">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Address</mat-label>
            <input matInput [(ngModel)]="profile.address" placeholder="Enter address">
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="updateProfile()" [disabled]="loading">
            Save Changes
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 2rem auto;
    }
    .profile-card {
      padding: 2rem;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 1.5rem;
    }
    .error-message {
      color: #d32f2f;
      background-color: #ffebee;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    .success-message {
      color: #388e3c;
      background-color: #e8f5e9;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile = { fullName: '', email: '', phone: '', address: '' };
  loading = false;
  error: string | null = null;
  success = false;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    this.loading = true;
    this.error = null;
    this.success = false;
    this.userService.updateProfile(this.profile).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => this.success = false, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to update profile';
      }
    });
  }
}
