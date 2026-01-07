import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-staff-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="register-logo mb-3">
          <h5 class="mb-1">Staff Registration</h5>
          <p class="text-muted small">Register as a Service Manager or Technician</p>
        </div>
        
        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        @if (success) {
          <div class="alert alert-success">
            <i class="bi bi-check-circle me-2"></i>
            {{ success }}
          </div>
        }
        
        @if (!success) {
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
              <label class="form-label">Role</label>
              <select class="form-select" [(ngModel)]="form.role" name="role" required>
                <option value="">Select Role</option>
                <option value="ServiceManager">Service Manager</option>
                <option value="Technician">Technician</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <div class="input-group">
                <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="form.password" name="password" required minlength="6">
                <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword">
                  <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              <small class="text-muted">Must be at least 6 characters</small>
            </div>
            <div class="mb-3">
              <label class="form-label">Confirm Password</label>
              <div class="input-group">
                <input [type]="showConfirmPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="form.confirmPassword" name="confirmPassword" required>
                <button type="button" class="btn btn-outline-secondary" (click)="showConfirmPassword = !showConfirmPassword">
                  <i class="bi" [ngClass]="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              @if (form.confirmPassword && form.password !== form.confirmPassword) {
                <small class="text-danger">Passwords do not match</small>
              }
            </div>
            
            <div class="alert alert-info small">
              <i class="bi bi-info-circle me-2"></i>
              Your account will be pending until approved by an administrator. You will be able to login after approval.
            </div>
            
            <button type="submit" class="btn btn-primary w-100" 
                    [disabled]="loading || !isFormValid()">
              @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ loading ? 'Submitting...' : 'Submit Registration' }}
            </button>
          </form>
        }
        
        <hr class="my-4">
        <p class="text-center text-muted small mb-2">
          Already have an account? <a routerLink="/login" class="text-primary">Sign in here</a>
        </p>
        <p class="text-center text-muted small mb-0">
          Are you a customer? <a routerLink="/register" class="text-primary">Register here</a>
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
      padding: 0.75rem 1.5rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 500px;
      margin-right: 5%;
    }
    .register-card .mb-3 { margin-bottom: 0.35rem !important; }
    .register-card .mb-4 { margin-bottom: 0.35rem !important; }
    .register-card .mb-1 { margin-bottom: 0.15rem !important; }
    .register-card .my-4 { margin-top: 0.5rem !important; margin-bottom: 0.35rem !important; }
    .register-card hr { margin: 0.5rem 0 !important; }
    .register-card .form-label { margin-bottom: 0.1rem; font-size: 0.75rem; }
    .register-card .form-control { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
    .register-card .form-select { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
    .register-card .btn { padding: 0.35rem 0.7rem; font-size: 0.85rem; }
    .register-card small { font-size: 0.65rem; }
    .register-card .alert { padding: 0.4rem 0.6rem; font-size: 0.75rem; margin-bottom: 0.35rem !important; }
    .input-group .btn { border-color: #dee2e6; padding: 0.25rem 0.4rem; }
    .input-group .btn:hover { background-color: #e9ecef; }
    .register-logo { max-width: 90px; height: auto; }
    .register-card .mb-3:has(.register-logo) { margin-bottom: 0.15rem !important; }
    .register-card h5 { font-size: 0.95rem; margin-bottom: 0.1rem !important; }
    .register-card p.small { font-size: 0.7rem; margin-bottom: 0.35rem !important; }
    @media (max-width: 768px) {
      .register-container { justify-content: center; padding: 0.5rem; }
      .register-card { margin-right: 0; }
    }
  `]
})
export class StaffRegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: ''
  };
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
      this.form.confirmPassword &&
      this.form.phoneNumber &&
      this.form.role &&
      this.form.password.length >= 6 &&
      this.form.password === this.form.confirmPassword
    );
  }

  submit() {
    if (!this.isFormValid()) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.registerStaff(this.form).subscribe({
      next: (res) => {
        if (res.success) {
          this.success = 'Registration submitted! Please verify your email with the OTP sent to your inbox.';
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
