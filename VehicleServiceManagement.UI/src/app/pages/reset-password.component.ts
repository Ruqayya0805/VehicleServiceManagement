import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="reset-container">
      <div class="reset-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="reset-logo mb-3">
          <h4 class="mb-2">Reset Your Password</h4>
          @if (!tokenError && !success) {
            <p class="text-muted small">Enter your new password below</p>
          }
        </div>

        @if (tokenError) {
          <div class="text-center">
            <div class="mb-4">
              <i class="bi bi-exclamation-triangle text-warning" style="font-size: 48px;"></i>
            </div>
            <div class="alert alert-warning">
              <strong>Invalid or Expired Link</strong>
              <p class="mb-0 mt-2 small">{{ tokenError }}</p>
            </div>
            <a routerLink="/forgot-password" class="btn btn-primary mt-3">
              Request New Reset Link
            </a>
          </div>
        }

        @if (error && !tokenError) {
          <div class="alert alert-danger py-2">
            <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
          </div>
        }

        @if (success) {
          <div class="text-center">
            <div class="mb-4">
              <i class="bi bi-check-circle text-success" style="font-size: 48px;"></i>
            </div>
            <div class="alert alert-success">
              <strong>Password Reset Successful!</strong>
              <p class="mb-0 mt-2 small">{{ success }}</p>
            </div>
            <a routerLink="/login" class="btn btn-primary mt-3">
              Sign In Now
            </a>
          </div>
        }

        @if (!tokenError && !success) {
          <form (ngSubmit)="submit()" autocomplete="off">
            <div class="mb-3">
              <label class="form-label">New Password</label>
              <div class="input-group">
                <input 
                  [type]="showPassword ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="newPassword" 
                  name="newPassword" 
                  placeholder="Enter new password"
                  required 
                  minlength="6"
                  autocomplete="new-password">
                <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword">
                  <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              @if (newPassword && newPassword.length < 6) {
                <small class="text-danger">Password must be at least 6 characters</small>
              }
            </div>

            <div class="mb-4">
              <label class="form-label">Confirm New Password</label>
              <div class="input-group">
                <input 
                  [type]="showConfirmPassword ? 'text' : 'password'" 
                  class="form-control" 
                  [(ngModel)]="confirmPassword" 
                  name="confirmPassword" 
                  placeholder="Confirm new password"
                  required 
                  autocomplete="new-password">
                <button type="button" class="btn btn-outline-secondary" (click)="showConfirmPassword = !showConfirmPassword">
                  <i class="bi" [ngClass]="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
              @if (confirmPassword && newPassword !== confirmPassword) {
                <small class="text-danger">Passwords do not match</small>
              }
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading || !isFormValid()">
              @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        }

        <hr class="my-4">
        <p class="text-center text-muted small mb-0">
          Remember your password? <a routerLink="/login" class="text-primary">Sign In</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .reset-container { 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: flex-end; 
      background: url('/auth-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 2rem;
    }
    .reset-card { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 2.5rem; 
      border-radius: 16px; 
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); 
      width: 100%; 
      max-width: 420px;
      margin-right: 5%;
    }
    .reset-logo { 
      max-width: 150px; 
      height: auto; 
    }
    .input-group .btn { border-color: #dee2e6; }
    .input-group .btn:hover { background-color: #e9ecef; }
    @media (max-width: 768px) {
      .reset-container { justify-content: center; padding: 1rem; }
      .reset-card { margin-right: 0; }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  token = '';
  email = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = '';
  tokenError = '';
  showPassword = false;
  showConfirmPassword = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';

      if (!this.token) {
        this.tokenError = 'No reset token provided. Please request a new password reset link.';
      }
    });
  }

  isFormValid(): boolean {
    return !!(
      this.newPassword &&
      this.newPassword.length >= 6 &&
      this.confirmPassword &&
      this.newPassword === this.confirmPassword
    );
  }

  submit() {
    if (!this.isFormValid()) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.resetPasswordWithToken({
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (res) => {
        if (res.success && res.data?.success) {
          this.success = res.data.message || 'Your password has been reset successfully.';
        } else {
          this.error = res.data?.message || res.message || 'Failed to reset password';
          if (res.message?.toLowerCase().includes('expired') || res.message?.toLowerCase().includes('invalid')) {
            this.tokenError = res.message;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        if (errorMessage.toLowerCase().includes('expired') || errorMessage.toLowerCase().includes('invalid')) {
          this.tokenError = errorMessage;
        } else {
          this.error = errorMessage;
        }
        this.loading = false;
      }
    });
  }
}
