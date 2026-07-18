import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnDestroy {
  registerForm: FormGroup;
  isSubmitting = false;

  // Password visibility toggles
  showPassword = false;
  showConfirmPassword = false;

  // Email OTP state
  emailOtpSent = false;
  emailOtpVerified = false;
  emailCountdown = 0;
  private emailTimerId: ReturnType<typeof setInterval> | null = null;

  // Phone OTP state
  phoneOtpSent = false;
  phoneOtpVerified = false;
  phoneCountdown = 0;
  private phoneTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      emailOtp: [''],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      phoneOtp: [''],
      gender: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnDestroy(): void {
    if (this.emailTimerId) {
      clearInterval(this.emailTimerId);
    }
    if (this.phoneTimerId) {
      clearInterval(this.phoneTimerId);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Email verification
  verifyEmail(): void {
    const emailControl = this.registerForm.get('email');
    if (emailControl?.invalid) {
      emailControl.markAsTouched();
      return;
    }
    this.emailOtpSent = true;
    this.startEmailCountdown();
    this.notificationService.show('OTP sent to your email address.', 'success');
  }

  resendEmailOtp(): void {
    this.startEmailCountdown();
    this.notificationService.show('OTP resent to your email address.', 'success');
  }

  private startEmailCountdown(): void {
    this.emailCountdown = 60;
    if (this.emailTimerId) {
      clearInterval(this.emailTimerId);
    }
    this.emailTimerId = setInterval(() => {
      this.emailCountdown--;
      if (this.emailCountdown <= 0) {
        if (this.emailTimerId) {
          clearInterval(this.emailTimerId);
          this.emailTimerId = null;
        }
      }
    }, 1000);
  }

  // Phone verification
  verifyPhone(): void {
    const phoneControl = this.registerForm.get('phone');
    if (phoneControl?.invalid) {
      phoneControl.markAsTouched();
      return;
    }
    this.phoneOtpSent = true;
    this.startPhoneCountdown();
    this.notificationService.show('OTP sent to your phone number.', 'success');
  }

  resendPhoneOtp(): void {
    this.startPhoneCountdown();
    this.notificationService.show('OTP resent to your phone number.', 'success');
  }

  private startPhoneCountdown(): void {
    this.phoneCountdown = 60;
    if (this.phoneTimerId) {
      clearInterval(this.phoneTimerId);
    }
    this.phoneTimerId = setInterval(() => {
      this.phoneCountdown--;
      if (this.phoneCountdown <= 0) {
        if (this.phoneTimerId) {
          clearInterval(this.phoneTimerId);
          this.phoneTimerId = null;
        }
      }
    }, 1000);
  }

  onCancel(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { name, email, password } = this.registerForm.value;
    this.authService.register({ username: name, email, password }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.notificationService.show('Registration successful! Please log in.', 'success');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isSubmitting = false;
        this.notificationService.show('Registration failed. Please try again.', 'error');
      },
    });
  }

  get name() { return this.registerForm.get('name'); }
  get email() { return this.registerForm.get('email'); }
  get emailOtp() { return this.registerForm.get('emailOtp'); }
  get phone() { return this.registerForm.get('phone'); }
  get phoneOtp() { return this.registerForm.get('phoneOtp'); }
  get gender() { return this.registerForm.get('gender'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
