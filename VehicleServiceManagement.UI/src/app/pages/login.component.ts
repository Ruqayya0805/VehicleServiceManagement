import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { LoginRequest } from '../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="login-logo mb-3">
          <p class="text-muted">Sign in to your account</p>
        </div>
        @if (error) {
          <div class="alert alert-danger">{{ error }}</div>
        }
        <form (ngSubmit)="submit()" autocomplete="off">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" [(ngModel)]="credentials.email" name="email" placeholder="Enter your email" required autocomplete="new-email">
          </div>
          <div class="mb-3">
            <label class="form-label">Password</label>
            <div class="input-group">
              <input [type]="showPassword ? 'text' : 'password'" class="form-control" [(ngModel)]="credentials.password" name="password" placeholder="Enter your password" required autocomplete="new-password">
              <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword">
                <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-100" [disabled]="loading || !credentials.email || !credentials.password">
            @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
          <div class="text-end mt-2">
            <a routerLink="/forgot-password" class="forgot-link">Forgot Password?</a>
          </div>
        </form>
        <hr class="my-4">
        <p class="text-center text-muted small mb-2">
          Don't have an account? <a routerLink="/register" class="text-primary">Register here</a>
        </p>
        <p class="text-center text-muted small mb-0">
          Are you staff? <a routerLink="/staff-register" class="text-primary">Register as Staff</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      background: url('/auth-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 2rem;
    }
    .login-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 420px;
      margin-right: 5%;
    }
    .login-logo { max-width: 200px; height: auto; }
    .forgot-link { color: #6c757d; font-size: 0.875rem; text-decoration: none; }
    .forgot-link:hover { color: #0d6efd; }
    .input-group .btn { border-color: #dee2e6; }
    .input-group .btn:hover { background-color: #e9ecef; }
    @media (max-width: 768px) {
      .login-container { justify-content: center; padding: 1rem; }
      .login-card { margin-right: 0; }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials: LoginRequest = { email: '', password: '' };
  loading = false;
  error = '';
  showPassword = false;

  submit() {
    if (!this.credentials.email || !this.credentials.password) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        if (res.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.error = res.message || 'Login failed';
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Invalid credentials';
        this.loading = false;
      }
    });
  }
}

