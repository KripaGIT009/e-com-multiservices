import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: [''],
      lastName: [''],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.http.get<UserProfile>('/api/profile').subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          username: profile.username,
          email: profile.email,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notificationService.show('Failed to load profile.', 'error');
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.http.put('/api/profile', this.profileForm.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.show('Profile updated successfully!', 'success');
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Failed to update profile.', 'error');
      },
    });
  }
}
