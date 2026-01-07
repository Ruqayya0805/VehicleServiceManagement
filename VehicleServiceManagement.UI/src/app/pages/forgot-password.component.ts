import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="forgot-container">
      <div class="forgot-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="forgot-logo mb-3">
          <h4 class="mb-2">Forgot Password?</h4>
          <p class="text-muted small">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        @if (error) {
          <div class="alert alert-danger py-2">
            <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
          </div>
        }

        @if (success) {
          <div class="alert alert-success py-2">
            <i class="bi bi-check-circle me-2"></i>{{ success }}
          </div>
          <div class="text-center mt-4">
            <p class="text-muted small">
              Didn't receive the email? Check your spam folder or
              <button type="button" class="btn btn-link p-0 align-baseline" (click)="resetForm()">
                try again
              </button>
            </p>
          </div>
        }

        @if (!success) {
          <form (ngSubmit)="submit()" autocomplete="off">
            <div class="mb-4">
              <label class="form-label">Email Address</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input 
                  type="email" 
                  class="form-control" 
                  [(ngModel)]="email" 
                  name="email" 
                  placeholder="Enter your registered email" 
                  required 
                  autocomplete="off">
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading || !email">
              @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
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
    .forgot-container { 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: flex-end; 
      background: url('/auth-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 2rem;
    }
    .forgot-card { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 2.5rem; 
      border-radius: 16px; 
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); 
      width: 100%; 
      max-width: 420px;
      margin-right: 5%;
    }
    .forgot-logo { 
      max-width: 150px; 
      height: auto; 
    }
    .input-group-text {
      background-color: #f8f9fa;
    }
    @media (max-width: 768px) {
      .forgot-container { justify-content: center; padding: 1rem; }
      .forgot-card { margin-right: 0; }
    }
  `]
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  loading = false;
  error = '';
  success = '';

  submit() {
    if (!this.email) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: (res) => {
        this.success = 'If an account exists with this email, you will receive a password reset link shortly.';
        this.loading = false;
      },
      error: (err) => {
        this.success = 'If an account exists with this email, you will receive a password reset link shortly.';
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.email = '';
    this.success = '';
    this.error = '';
  }
}
