import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { RegisterRequest } from '../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="register-logo mb-3">
          <h5 class="mb-1">Create an Account</h5>
          <p class="text-muted small">Register as a customer to request vehicle services</p>
        </div>
        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        @if (success) {
          <div class="alert alert-success">{{ success }}</div>
        }
        <form (ngSubmit)="submit()">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">First Name</label>
              <input type="text" class="form-control" [(ngModel)]="form.firstName" name="firstName" required>
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Last Name</label>
              <input type="text" class="form-control" [(ngModel)]="form.lastName" name="lastName" required>
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.email" name="email" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-control" [(ngModel)]="form.phoneNumber" name="phoneNumber" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group input-group-sm">
              <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="form.password" name="password" required minlength="6">
              <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword">
                <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            <small class="text-muted">Min. 6 characters</small>
          </div>
          <div class="mb-3">
            <label class="form-label">Confirm Password</label>
            <div class="input-group input-group-sm">
              <input [type]="showConfirmPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="confirmPassword" name="confirmPassword" required>
              <button type="button" class="btn btn-outline-secondary" (click)="showConfirmPassword = !showConfirmPassword">
                <i class="bi" [ngClass]="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            @if (confirmPassword && form.password !== confirmPassword) {
              <small class="text-danger">Passwords do not match</small>
            }
          </div>
          <button type="submit" class="btn btn-primary w-100" 
                  [disabled]="loading || !isFormValid()">
            @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>
        <hr class="my-4">
        <p class="text-center text-muted small mb-0">
          Already have an account? <a routerLink="/login" class="text-primary">Sign in here</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      background: url('/auth-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 0.5rem 2rem;
      overflow: hidden;
    }
    .register-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 440px;
      margin-right: 5%;
    }
    .register-card .mb-3 { margin-bottom: 0.5rem !important; }
    .register-card .mb-4 { margin-bottom: 0.5rem !important; }
    .register-card .mb-1 { margin-bottom: 0.25rem !important; }
    .register-card .my-4 { margin-top: 0.75rem !important; margin-bottom: 0.5rem !important; }
    .register-card hr { margin: 0.75rem 0 !important; }
    .register-card .form-label { margin-bottom: 0.15rem; font-size: 0.8rem; }
    .register-card .form-control { padding: 0.3rem 0.6rem; font-size: 0.875rem; }
    .register-card .btn { padding: 0.4rem 0.75rem; font-size: 0.875rem; }
    .register-card small { font-size: 0.7rem; }
    .input-group .btn { border-color: #dee2e6; padding: 0.3rem 0.5rem; }
    .input-group .btn:hover { background-color: #e9ecef; }
    .register-logo { max-width: 100px; height: auto; }
    .register-card .mb-3:has(.register-logo) { margin-bottom: 0.25rem !important; }
    .register-card h5 { font-size: 1rem; margin-bottom: 0.15rem !important; }
    .register-card p.small { font-size: 0.75rem; margin-bottom: 0.5rem !important; }
    @media (max-width: 768px) {
      .register-container { justify-content: center; padding: 0.5rem; }
      .register-card { margin-right: 0; }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form: RegisterRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'Customer'
  };
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';
  showPassword = false;
  showConfirmPassword = false;

  isFormValid(): boolean {
    return !!(
      this.form.firstName &&
      this.form.lastName &&
      this.form.email &&
      this.form.password &&
      this.form.phoneNumber &&
      this.form.password.length >= 6 &&
      this.form.password === this.confirmPassword
    );
  }

  submit() {
    if (!this.isFormValid()) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.success = 'Account created! Please verify your email with the OTP sent to your inbox.';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/verify-otp'], { queryParams: { email: this.form.email } });
          }, 1500);
        } else {
          this.error = res.message || 'Registration failed';
          this.loading = false;
        }
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
