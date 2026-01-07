import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="otp-container">
      <div class="otp-card">
        <div class="text-center mb-4">
          <img src="logo.png" alt="CVMS Logo" class="otp-logo mb-3">
          <h4 class="mb-2">Verify Your Email</h4>
          <p class="text-muted">
            We've sent a 6-digit OTP to<br>
            <strong>{{ email }}</strong>
          </p>
        </div>

        @if (error) {
          <div class="alert alert-danger py-2">
            <i class="bi bi-exclamation-circle me-2"></i>{{ error }}
            @if (remainingAttempts !== null && remainingAttempts !== undefined) {
              <br><small>Attempts remaining: {{ remainingAttempts }}</small>
            }
          </div>
        }

        @if (success) {
          <div class="alert alert-success py-2">
            <i class="bi bi-check-circle me-2"></i>{{ success }}
          </div>
        }

        <form (ngSubmit)="verify()" autocomplete="off">
          <div class="mb-4">
            <label class="form-label">Enter OTP</label>
            <div class="otp-input-group">
              @for (i of [0,1,2,3,4,5]; track i) {
                <input 
                  type="text" 
                  maxlength="1" 
                  class="form-control otp-input"
                  [(ngModel)]="otpDigits[i]"
                  [name]="'otp' + i"
                  (keyup)="onOtpKeyUp($event, i)"
                  (paste)="onPaste($event)"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  #otpInput>
              }
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-100 mb-3" [disabled]="loading || !isOtpComplete()">
            @if (loading) { <span class="spinner-border spinner-border-sm me-2"></span> }
            {{ loading ? 'Verifying...' : 'Verify Email' }}
          </button>
        </form>

        <div class="text-center">
          <p class="text-muted mb-2">
            Didn't receive the code?
            @if (resendTimer > 0) {
              <span class="text-primary">Resend in {{ resendTimer }}s</span>
            } @else {
              <button type="button" class="btn btn-link p-0" (click)="resend()" [disabled]="resending">
                @if (resending) { <span class="spinner-border spinner-border-sm"></span> }
                {{ resending ? 'Sending...' : 'Resend OTP' }}
              </button>
            }
          </p>
        </div>

        <hr class="my-3">

        <p class="text-center text-muted small mb-0">
          Wrong email? <a routerLink="/register" class="text-primary">Go back to register</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .otp-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      background: url('/auth-bg.jpg') no-repeat center center;
      background-size: cover;
      padding: 2rem;
    }
    .otp-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 420px;
      margin-right: 5%;
    }
    .otp-logo { max-width: 150px; height: auto; }
    .otp-input-group {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
    .otp-input {
      width: 50px;
      height: 56px;
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      border-radius: 8px;
      border: 2px solid #dee2e6;
      transition: border-color 0.2s;
    }
    .otp-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }
    @media (max-width: 768px) {
      .otp-container { justify-content: center; padding: 1rem; }
      .otp-card { margin-right: 0; }
      .otp-input {
        width: 42px;
        height: 48px;
        font-size: 20px;
      }
    }
  `]
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  loading = false;
  resending = false;
  error = '';
  success = '';
  remainingAttempts: number | null = null;
  resendTimer = 60;
  private timerInterval: any;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.email = params['email'];
      } else {
        this.email = this.authService.getPendingEmailVerification() || '';
      }
    });

    if (!this.email) {
      this.router.navigate(['/register']);
      return;
    }

    this.startResendTimer();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startResendTimer() {
    this.resendTimer = 60;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(d => d.length === 1 && /^\d$/.test(d));
  }

  getOtp(): string {
    return this.otpDigits.join('');
  }

  onOtpKeyUp(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (!/^\d*$/.test(value)) {
      this.otpDigits[index] = '';
      return;
    }
    if (value && index < 5) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }
    if (event.key === 'Backspace' && !value && index > 0) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index - 1] as HTMLInputElement)?.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    digits.split('').forEach((digit, i) => {
      this.otpDigits[i] = digit;
    });
  }

  verify() {
    if (!this.isOtpComplete()) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.verifyOtp({
      email: this.email,
      otp: this.getOtp()
    }).subscribe({
      next: (res) => {
        if (res.success && res.data?.isVerified) {
          this.success = 'Email verified successfully! Redirecting to login...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.error = res.data?.message || res.message || 'Invalid OTP';
          this.remainingAttempts = res.data?.remainingAttempts ?? null;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Verification failed. Please try again.';
        this.loading = false;
      }
    });
  }

  resend() {
    this.resending = true;
    this.error = '';
    this.success = '';

    this.authService.resendOtp({ email: this.email }).subscribe({
      next: (res) => {
        if (res.success) {
          this.success = res.message || 'A new OTP has been sent to your email';
          this.otpDigits = ['', '', '', '', '', ''];
          this.remainingAttempts = null;
          this.startResendTimer();
        } else {
          this.error = res.message || 'Failed to resend OTP';
        }
        this.resending = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to resend OTP';
        this.resending = false;
      }
    });
  }
}
