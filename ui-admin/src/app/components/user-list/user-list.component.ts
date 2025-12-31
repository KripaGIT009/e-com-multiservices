import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../services/user.service';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h1><mat-icon>people</mat-icon> User Management</h1>
        <p class="subtitle">Manage user accounts and permissions</p>
      </div>

      <button mat-raised-button color="primary" class="add-button" (click)="openAddDialog()">
        <mat-icon>add_circle</mat-icon> Add New User
      </button>

      <div *ngIf="showInlineForm" class="form-container">
        <mat-card class="add-form-card">
          <div class="form-header">
            <mat-icon>person_add</mat-icon>
            <h2>Create New User</h2>
          </div>
          <mat-card-content>
            <form [formGroup]="inlineForm" (ngSubmit)="saveInline()">
                  <div class="row">
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>Username</mat-label>
                        <input matInput formControlName="username" required>
                      </mat-form-field>
                    </div>
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>Email</mat-label>
                        <input matInput type="email" formControlName="email" required>
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>Password</mat-label>
                        <input matInput type="password" formControlName="password" required>
                      </mat-form-field>
                    </div>
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>Role</mat-label>
                        <mat-select formControlName="role" required>
                          <mat-option value="ADMIN">Admin</mat-option>
                          <mat-option value="CUSTOMER">Customer</mat-option>
                          <mat-option value="GUEST">Guest</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>First Name</mat-label>
                        <input matInput formControlName="firstName">
                      </mat-form-field>
                    </div>
                    <div class="col">
                      <mat-form-field class="full-width">
                        <mat-label>Last Name</mat-label>
                        <input matInput formControlName="lastName">
                      </mat-form-field>
                    </div>
                  </div>
                  <div class="form-actions">
                    <button mat-stroked-button type="button" (click)="cancelInline()" class="cancel-btn">
                      <mat-icon>close</mat-icon> Cancel
                    </button>
                    <button mat-raised-button color="primary" type="submit" [disabled]="!inlineForm.valid" class="save-btn">
                      <mat-icon>save</mat-icon> Save User
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>

          <mat-card class="table-card">
            <table mat-table [dataSource]="users" class="mat-elevation-z2 full-width">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let user">{{user.id}}</td>
            </ng-container>
            
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Username</th>
              <td mat-cell *matCellDef="let user">{{user.username}}</td>
            </ng-container>

            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>Full Name</th>
              <td mat-cell *matCellDef="let user">{{(user.firstName || '') + (user.lastName ? ' ' + user.lastName : '')}}</td>
            </ng-container>
            
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{user.email}}</td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button color="primary" (click)="openEditDialog(user)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteUser(user.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: calc(100vh - 64px);
    }

    .page-header {
      text-align: center;
      margin-bottom: 32px;
      animation: fadeIn 0.6s ease-in;
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 2rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 8px 0;
    }

    .page-header h1 mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .subtitle {
      font-size: 1rem;
      color: #7f8c8d;
      margin: 0;
    }

    .add-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px !important;
      font-size: 1rem !important;
      font-weight: 500 !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(63, 81, 181, 0.3) !important;
      transition: all 0.3s ease !important;
      margin-bottom: 24px;
    }

    .add-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(63, 81, 181, 0.4) !important;
    }

    .add-button mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .form-container {
      margin-bottom: 24px;
      animation: slideDown 0.4s ease-out;
    }

    .add-form-card {
      background: white;
      border-radius: 12px !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
      overflow: hidden;
    }

    .form-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .form-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .add-form-card mat-card-content {
      padding: 24px !important;
    }

    .table-card {
      background: white;
      border-radius: 12px !important;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
    }

    table {
      width: 100%;
      background: white;
    }

    .full-width {
      width: 100%;
    }

    .row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .col {
      flex: 1;
    }

    mat-form-field {
      width: 100%;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 8px 20px !important;
      border-radius: 8px !important;
    }

    .save-btn {
      padding: 8px 20px !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(63, 81, 181, 0.3) !important;
    }

    .save-btn:hover:not([disabled]) {
      box-shadow: 0 4px 12px rgba(63, 81, 181, 0.4) !important;
    }

    .save-btn mat-icon,
    .cancel-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-20px);
        max-height: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0);
        max-height: 1000px;
      }
    }

    ::ng-deep .mat-mdc-form-field {
      margin-bottom: 8px;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    mat-header-cell {
      font-weight: 600 !important;
      color: #2c3e50 !important;
      background: #f8f9fa;
    }

    mat-row:hover {
      background-color: #f8f9fa;
      transition: background-color 0.2s ease;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  displayedColumns: string[] = ['id', 'username', 'fullName', 'email', 'actions'];
  showInlineForm = false;
  inlineForm: FormGroup;
  private isBrowser: boolean;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.inlineForm = this.fb.group({
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
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          this.users = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Failed to parse users payload', e);
          this.users = [];
        }
      },
      error: (error) => {
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
        this.users = [];
      }
    });
  }

  openAddDialog(): void {
    // Show inline form
    this.showInlineForm = true;
    this.inlineForm.reset();
  }

  saveInline(): void {
    if (this.inlineForm.valid) {
      const payload = this.inlineForm.value;
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
          this.showInlineForm = false;
          this.inlineForm.reset();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error creating user (inline):', error);
          this.snackBar.open('Error creating user', 'Close', { duration: 3000 });
        }
      });
    }
  }

  cancelInline(): void {
    this.showInlineForm = false;
  }

  openEditDialog(user: any): void {
    if (!this.isBrowser) {
      return;
    }
    
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '500px',
      data: { user: user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(user.id, result).subscribe({
          next: () => {
            this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: (error) => {
            this.snackBar.open('Error updating user', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteUser(id: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: (error) => {
          this.snackBar.open('Error deleting user', 'Close', { duration: 3000 });
        }
      });
    }
  }
}

