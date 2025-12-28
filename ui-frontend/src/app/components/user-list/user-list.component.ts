import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
    MatInputModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>User Management</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <button mat-raised-button color="primary" class="mb-3" (click)="openAddDialog()">
            <mat-icon>add</mat-icon> Add New User
          </button>

          <div *ngIf="showInlineForm" class="mb-3">
            <mat-card class="mat-elevation-z2">
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
                  <div class="mt-2" style="text-align:right;">
                    <button mat-button type="button" (click)="cancelInline()">Cancel</button>
                    <button mat-raised-button color="primary" type="submit" [disabled]="!inlineForm.valid">Save</button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>
          </div>
          
          <table mat-table [dataSource]="users" class="mat-elevation-z8 full-width">
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
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    table {
      width: 100%;
    }
  `]
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  displayedColumns: string[] = ['id', 'username', 'fullName', 'email', 'actions'];
  showInlineForm = false;
  inlineForm: FormGroup;

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.inlineForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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
    console.log('Opening add user dialog...');
    alert('Opening Add User dialog');
    try {
      const dialogRef = this.dialog.open(UserDialogComponent, {
        width: '500px',
        data: { user: null }
      });
      console.log('Dialog opened successfully');
      this.snackBar.open('Dialog opened', 'Close', { duration: 2000 });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog closed with result:', result);
        if (result) {
          console.log('Creating user with data:', result);
          this.userService.createUser(result).subscribe({
            next: (response) => {
              console.log('User created successfully:', response);
              this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
              this.loadUsers();
            },
            error: (error) => {
              console.error('Error creating user:', error);
              this.snackBar.open(`Error creating user: ${error.message || 'Unknown error'}`, 'Close', { duration: 5000 });
            }
          });
        } else {
          // Fallback to inline form
          this.showInlineForm = true;
          this.snackBar.open('Using inline form fallback', 'Close', { duration: 2000 });
        }
      });
    } catch (error) {
      console.error('Error opening dialog:', error);
      this.snackBar.open('Error opening dialog', 'Close', { duration: 3000 });
      this.showInlineForm = true;
    }
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
