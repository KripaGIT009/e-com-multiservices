import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
  registrationDate: string;
  status: string;
}

interface UserEditForm {
  name: string;
  email: string;
  status: string;
}

/**
 * Admin User Management sub-page.
 * Displays a paginated user table with edit functionality.
 * Requirements: 12.1, 12.2, 12.3
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  private readonly apiUrl = '/api/users';

  users: User[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;

  // Edit form
  editingUser: User | null = null;
  editForm: UserEditForm = { name: '', email: '', status: '' };
  isSubmitting = false;
  showSuccess = false;
  formError = '';
  validationErrors: { [key: string]: string } = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.http.get<any>(this.apiUrl).subscribe({
      next: (response) => {
        // Handle both paginated response { content: [...] } and plain array
        const rawData = Array.isArray(response) ? response : (response.content || []);
        const data: User[] = rawData.map((u: any) => ({
          id: u.id,
          name: u.name || ((u.firstName || '') + ' ' + (u.lastName || '')).trim() || u.username || '',
          email: u.email || '',
          registrationDate: u.registrationDate || u.createdAt || '',
          status: u.status || (u.role === 'ADMIN' ? 'Active' : 'Active'),
        }));
        this.totalUsers = Array.isArray(response) ? data.length : (response.totalElements || data.length);
        this.totalPages = Math.ceil(this.totalUsers / this.pageSize);
        this.users = this.getPaginatedUsers(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.hasError = true;
        this.errorMessage = err.error?.error || 'Failed to load users';
        this.isLoading = false;
      },
    });
  }

  private getPaginatedUsers(allUsers: User[]): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return allUsers.slice(start, end);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // Edit functionality
  startEdit(user: User): void {
    this.editingUser = user;
    this.editForm = {
      name: user.name,
      email: user.email,
      status: user.status || 'Active',
    };
    this.formError = '';
    this.validationErrors = {};
    this.showSuccess = false;
  }

  cancelEdit(): void {
    this.editingUser = null;
    this.formError = '';
    this.validationErrors = {};
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.editForm.name || this.editForm.name.trim().length === 0) {
      this.validationErrors['name'] = 'Name is required';
    }

    if (!this.editForm.email || this.editForm.email.trim().length === 0) {
      this.validationErrors['email'] = 'Email is required';
    } else if (!this.isValidEmail(this.editForm.email)) {
      this.validationErrors['email'] = 'Please enter a valid email address';
    }

    if (!this.editForm.status) {
      this.validationErrors['status'] = 'Status is required';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  submitEdit(): void {
    if (!this.editingUser || !this.validateForm()) return;

    this.isSubmitting = true;
    this.formError = '';
    this.showSuccess = false;

    const payload = {
      name: this.editForm.name.trim(),
      email: this.editForm.email.trim(),
      status: this.editForm.status,
    };

    this.http.put(`${this.apiUrl}/${this.editingUser.id}`, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showSuccess = true;
        this.editingUser = null;
        this.loadUsers();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err.error?.error || 'Failed to update user';
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge--active';
      case 'inactive':
        return 'badge--inactive';
      default:
        return 'badge--inactive';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  retry(): void {
    this.loadUsers();
  }
}
