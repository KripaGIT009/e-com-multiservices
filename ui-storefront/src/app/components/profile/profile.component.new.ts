import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="profile-page">
      <!-- Cover Photo Section -->
      <div class="cover-photo">
        <div class="cover-overlay"></div>
        <div class="profile-top">
          <div class="avatar-section">
            <div class="avatar-wrapper">
              <div class="avatar-circle">{{ getInitials() }}</div>
              <div class="avatar-badge">
                <mat-icon>verified</mat-icon>
              </div>
            </div>
            <div class="user-info">
              <h1 class="username">{{ userData.username || 'User' }}</h1>
              <p class="user-email">{{ userData.email || 'user@example.com' }}</p>
              <div class="user-meta">
                <span class="meta-item">
                  <mat-icon>shield</mat-icon>
                  {{ userData.role || 'CUSTOMER' }}
                </span>
                <span class="meta-item">
                  <mat-icon>calendar_today</mat-icon>
                  Joined {{ formatDate(userData.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="profile-body">
        <div class="container">
          <div class="content-grid">
            <!-- Left Column -->
            <div class="main-column">
              <!-- Edit Profile Card -->
              <div class="card">
                <div class="card-header">
                  <h2><mat-icon>edit</mat-icon> Edit Profile</h2>
                  <p>Update your personal information</p>
                </div>
                <div class="card-body">
                  <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">
                          <mat-icon>person</mat-icon>
                          Username
                        </label>
                        <input type="text" class="form-input" formControlName="username" placeholder="Enter username" />
                        <span class="form-error" *ngIf="profileForm.get('username')?.invalid && profileForm.get('username')?.touched">
                          Username is required
                        </span>
                      </div>
                      <div class="form-group">
                        <label class="form-label">
                          <mat-icon>email</mat-icon>
                          Email Address
                        </label>
                        <input type="email" class="form-input" formControlName="email" placeholder="Enter email" />
                        <span class="form-error" *ngIf="profileForm.get('email')?.invalid && profileForm.get('email')?.touched">
                          Valid email required
                        </span>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">
                          <mat-icon>badge</mat-icon>
                          First Name
                        </label>
                        <input type="text" class="form-input" formControlName="firstName" placeholder="Enter first name" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">
                          <mat-icon>badge</mat-icon>
                          Last Name
                        </label>
                        <input type="text" class="form-input" formControlName="lastName" placeholder="Enter last name" />
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group full">
                        <label class="form-label">
                          <mat-icon>phone</mat-icon>
                          Phone Number
                        </label>
                        <input type="tel" class="form-input" formControlName="phone" placeholder="Enter phone number" />
                      </div>
                    </div>

                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" [disabled]="!profileForm.valid || loading">
                        <mat-icon>{{ loading ? 'sync' : 'save' }}</mat-icon>
                        {{ loading ? 'Saving...' : 'Save Changes' }}
                      </button>
                      <button type="button" class="btn btn-secondary" (click)="cancel()">
                        <mat-icon>close</mat-icon>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="side-column">
              <!-- Account Info Card -->
              <div class="card">
                <div class="card-header">
                  <h2><mat-icon>info</mat-icon> Account Info</h2>
                </div>
                <div class="card-body">
                  <div class="info-list">
                    <div class="info-item">
                      <div class="info-icon">
                        <mat-icon>fingerprint</mat-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">User ID</span>
                        <span class="info-value">{{ userData.userId || userData.id || 'N/A' }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-icon">
                        <mat-icon>workspace_premium</mat-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">Role</span>
                        <span class="info-value highlight">{{ userData.role || 'CUSTOMER' }}</span>
                      </div>
                    </div>
                    <div class="info-item">
                      <div class="info-icon">
                        <mat-icon>schedule</mat-icon>
                      </div>
                      <div class="info-content">
                        <span class="info-label">Last Updated</span>
                        <span class="info-value">{{ formatDate(userData.updatedAt) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Links Card -->
              <div class="card">
                <div class="card-header">
                  <h2><mat-icon>bolt</mat-icon> Quick Links</h2>
                </div>
                <div class="card-body">
                  <div class="quick-links">
                    <button class="quick-link" (click)="navigateTo('/orders')">
                      <div class="quick-link-icon">
                        <mat-icon>receipt_long</mat-icon>
                      </div>
                      <div class="quick-link-text">
                        <span>My Orders</span>
                        <small>View order history</small>
                      </div>
                      <mat-icon class="arrow">chevron_right</mat-icon>
                    </button>
                    <button class="quick-link" (click)="navigateTo('/cart')">
                      <div class="quick-link-icon">
                        <mat-icon>shopping_cart</mat-icon>
                      </div>
                      <div class="quick-link-text">
                        <span>Shopping Cart</span>
                        <small>View cart items</small>
                      </div>
                      <mat-icon class="arrow">chevron_right</mat-icon>
                    </button>
                    <button class="quick-link" (click)="navigateTo('/wishlist')">
                      <div class="quick-link-icon">
                        <mat-icon>favorite</mat-icon>
                      </div>
                      <div class="quick-link-text">
                        <span>Wishlist</span>
                        <small>Saved items</small>
                      </div>
                      <mat-icon class="arrow">chevron_right</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    * {
      box-sizing: border-box;
    }

    .profile-page {
      min-height: 100vh;
      background: #f5f7fa;
    }

    /* Cover Photo Section */
    .cover-photo {
      position: relative;
      height: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    .cover-overlay {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
    }

    .profile-top {
      position: relative;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      height: 100%;
    }

    .avatar-section {
      position: absolute;
      bottom: -60px;
      left: 24px;
      display: flex;
      align-items: flex-end;
      gap: 24px;
      z-index: 10;
    }

    .avatar-wrapper {
      position: relative;
    }

    .avatar-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      border: 6px solid white;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      letter-spacing: 2px;
    }

    .avatar-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 36px;
      height: 36px;
      background: #4CAF50;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .avatar-badge mat-icon {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .user-info {
      padding-bottom: 16px;
      color: white;
    }

    .username {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .user-email {
      margin: 0 0 12px 0;
      font-size: 16px;
      opacity: 0.95;
    }

    .user-meta {
      display: flex;
      gap: 20px;
      font-size: 14px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.2);
      padding: 6px 14px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .meta-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Main Content */
    .profile-body {
      padding: 80px 0 40px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }

    .card-header {
      padding: 24px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-bottom: 2px solid #f0f0f0;
    }

    .card-header h2 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-header h2 mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .card-header p {
      margin: 0;
      font-size: 14px;
      color: #7f8c8d;
    }

    .card-body {
      padding: 24px;
    }

    /* Form Styles */
    .form-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full {
      grid-column: 1 / -1;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .form-label mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 15px;
      font-family: inherit;
      transition: all 0.3s;
      background: #f8f9fa;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input::placeholder {
      color: #bdc3c7;
    }

    .form-error {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 6px;
      display: block;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      padding-top: 24px;
      border-top: 2px solid #f0f0f0;
    }

    /* Buttons */
    .btn {
      padding: 12px 28px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
      font-family: inherit;
    }

    .btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #7f8c8d;
      border: 2px solid #e0e0e0;
    }

    .btn-secondary:hover {
      background: #f8f9fa;
      border-color: #bdc3c7;
    }

    /* Info List */
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #667eea;
      transition: all 0.3s;
    }

    .info-item:hover {
      background: #f0f3ff;
      transform: translateX(4px);
    }

    .info-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .info-icon mat-icon {
      color: white;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .info-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 15px;
      font-weight: 600;
      color: #2c3e50;
    }

    .info-value.highlight {
      color: #667eea;
    }

    /* Quick Links */
    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .quick-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: left;
      font-family: inherit;
      width: 100%;
    }

    .quick-link:hover {
      background: white;
      border-color: #667eea;
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .quick-link-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .quick-link-icon mat-icon {
      color: white;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .quick-link-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .quick-link-text span {
      font-size: 15px;
      font-weight: 600;
      color: #2c3e50;
    }

    .quick-link-text small {
      font-size: 12px;
      color: #7f8c8d;
    }

    .quick-link .arrow {
      color: #bdc3c7;
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 0.3s;
    }

    .quick-link:hover .arrow {
      color: #667eea;
      transform: translateX(4px);
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .side-column {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }

      .side-column .card {
        margin-bottom: 0;
      }
    }

    @media (max-width: 768px) {
      .cover-photo {
        height: 200px;
      }

      .avatar-section {
        flex-direction: column;
        align-items: center;
        left: 50%;
        transform: translateX(-50%);
        bottom: -80px;
        text-align: center;
      }

      .avatar-circle {
        width: 120px;
        height: 120px;
        font-size: 40px;
      }

      .user-meta {
        flex-direction: column;
        gap: 8px;
        align-items: center;
      }

      .profile-body {
        padding: 100px 0 40px;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .side-column {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn-primary {
        width: 100%;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  userData: any = {};
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  loadUserData(): void {
    const user = localStorage.getItem('user');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    if (user) {
      try {
        this.userData = JSON.parse(user);
      } catch (e) {
        this.userData = { username, userId, email, role };
      }
    } else {
      this.userData = { username, userId, email, role };
    }

    // Update form with localStorage data immediately
    this.profileForm.patchValue({
      username: this.userData.username || username || '',
      email: this.userData.email || email || '',
      firstName: this.userData.firstName || '',
      lastName: this.userData.lastName || '',
      phone: this.userData.phone || ''
    });

    // Fetch full user data from API
    if (userId) {
      this.http.get(`http://localhost:8004/users/${userId}`).subscribe({
        next: (data: any) => {
          this.userData = { ...this.userData, ...data };
          // Update form with complete data from API
          this.profileForm.patchValue({
            username: data.username || this.userData.username || '',
            email: data.email || this.userData.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || ''
          });
        },
        error: (err) => {
          console.error('Failed to load user data:', err);
          // Keep the form populated with localStorage data
        }
      });
    }
  }

  initializeForm(): void {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
      phone: ['']
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    const userId = this.userData.userId || this.userData.id;

    this.http.put(`http://localhost:8004/users/${userId}`, this.profileForm.value).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.userData = { ...this.userData, ...response };
        localStorage.setItem('user', JSON.stringify(this.userData));
        localStorage.setItem('username', response.username);
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Failed to update profile. Please try again.', 'Close', { duration: 3000 });
        console.error('Update error:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  getInitials(): string {
    const username = this.userData.username || this.userData.email || 'U';
    const names = username.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      return date;
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
