import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="user-page">
      <div class="page-header">
        <div>
          <h2>Users</h2>
          <p class="page-sub">{{ users.length }} registered users</p>
        </div>
        <button class="add-btn" (click)="toggleForm()">
          {{ showForm ? 'âœ• Cancel' : '+ Add User' }}
        </button>
      </div>

      <div class="add-form" *ngIf="showForm">
        <h3>Create New User</h3>
        <form [formGroup]="form" (ngSubmit)="saveUser()">
          <div class="form-grid">
            <div class="form-field">
              <label>Username *</label>
              <input type="text" formControlName="username" placeholder="username" />
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input type="email" formControlName="email" placeholder="user@example.com" />
            </div>
            <div class="form-field">
              <label>Password *</label>
              <input type="password" formControlName="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
            </div>
            <div class="form-field">
              <label>Role *</label>
              <select formControlName="role">
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div class="form-field">
              <label>First Name</label>
              <input type="text" formControlName="firstName" placeholder="First" />
            </div>
            <div class="form-field">
              <label>Last Name</label>
              <input type="text" formControlName="lastName" placeholder="Last" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="toggleForm()">Cancel</button>
            <button type="submit" class="save-btn" [disabled]="!form.valid">Save User</button>
          </div>
        </form>
      </div>

      <div class="filter-bar">
        <input type="text" placeholder="Search by username or email..."
               [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()" />
      </div>

      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="36"></mat-spinner>
        <span>Loading users...</span>
      </div>

      <div class="empty-state" *ngIf="!loading && filtered.length === 0">
        <div class="empty-icon">ðŸ‘¤</div>
        <h3>No users found</h3>
        <p>Try adjusting your search or add a new user</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && filtered.length > 0">
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of filtered">
              <td><span class="user-id">#{{ u.id }}</span></td>
              <td><strong>{{ u.username }}</strong></td>
              <td>{{ (u.firstName || '') + (u.lastName ? ' ' + u.lastName : '') || 'â€”' }}</td>
              <td class="email-col">{{ u.email }}</td>
              <td>
                <button class="act-btn delete" (click)="deleteUser(u.id)">ðŸ—‘ Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .user-page { padding: 24px; background: #f0f2f2; min-height: 100%; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { font-size: 1.4rem; font-weight: 700; color: #111; margin: 0 0 4px; }
    .page-sub { font-size: 12px; color: #666; margin: 0; }
    .add-btn { background: #ff9900; border: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #111; font-weight: 600; }
    .add-btn:hover { background: #e68900; }
    .add-form { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .add-form h3 { margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #111; }
    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field label { font-size: 12px; font-weight: 600; color: #555; }
    .form-field input, .form-field select { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; outline: none; background: #fff; }
    .form-field input:focus, .form-field select:focus { border-color: #ff9900; }
    .form-actions { display: flex; gap: 10px; justify-content: flex-end; }
    .cancel-btn { background: #fff; border: 1px solid #d5d9d9; padding: 8px 16px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #333; }
    .save-btn { background: #ff9900; border: none; padding: 8px 20px; border-radius: 6px; font-size: 13px; cursor: pointer; color: #111; font-weight: 600; }
    .save-btn:disabled { background: #ddd; cursor: not-allowed; color: #999; }
    .filter-bar { background: #fff; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 16px; }
    .filter-bar input { border: 1px solid #d5d9d9; border-radius: 6px; padding: 8px 12px; font-size: 13px; width: 300px; outline: none; }
    .filter-bar input:focus { border-color: #ff9900; }
    .loading-wrap { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; background: #fff; border-radius: 8px; color: #666; font-size: 14px; }
    .empty-state { text-align: center; padding: 60px 20px; background: #fff; border-radius: 8px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #555; margin: 0 0 8px; }
    .empty-state p { color: #888; margin: 0; }
    .table-wrap { background: #fff; border-radius: 8px; border: 1px solid #e5e5e5; overflow-x: auto; }
    .user-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .user-table thead tr { background: #f7f7f7; border-bottom: 2px solid #e5e5e5; }
    .user-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .user-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .user-table tr:last-child td { border-bottom: none; }
    .user-table tr:hover td { background: #fafafa; }
    .user-id { color: #888; font-size: 12px; }
    .email-col { color: #555; font-size: 12px; }
    .act-btn { border: none; border-radius: 4px; padding: 5px 12px; font-size: 12px; cursor: pointer; font-weight: 600; }
    .act-btn.delete { background: #f8d7da; color: #721c24; }
    .act-btn.delete:hover { background: #f5c6cb; }
    @media (max-width: 900px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  loading = false;
  searchQuery = '';
  showForm = false;
  form: FormGroup;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['CUSTOMER', Validators.required],
      firstName: [''],
      lastName: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        this.users = Array.isArray(parsed) ? parsed : [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
        this.users = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) this.form.reset({ role: 'CUSTOMER' });
  }

  saveUser(): void {
    if (!this.form.valid) return;
    this.userService.createUser(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
        this.showForm = false;
        this.form.reset({ role: 'CUSTOMER' });
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Error creating user', 'Close', { duration: 3000 });
      }
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Delete this user?')) return;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.snackBar.open('User deleted', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => {
        this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filtered = [...this.users];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filtered = this.users.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }
}

