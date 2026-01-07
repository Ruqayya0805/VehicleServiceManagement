import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { User } from '../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white border-bottom">
              <h5 class="mb-0"><i class="bi bi-person-circle me-2"></i>My Profile</h5>
            </div>
            <div class="card-body">
              @if (loading) {
                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
              }

              @if (!loading && profile) {
                @if (success) {
                  <div class="alert alert-success alert-dismissible">
                    {{ success }}
                    <button type="button" class="btn-close" (click)="success = ''"></button>
                  </div>
                }
                @if (error) {
                  <div class="alert alert-danger alert-dismissible">
                    {{ error }}
                    <button type="button" class="btn-close" (click)="error = ''"></button>
                  </div>
                }

                <form (ngSubmit)="saveProfile()">
                  <!-- Account Info (read-only) -->
                  <div class="mb-4">
                    <h6 class="text-muted border-bottom pb-2 mb-3">Account Information</h6>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" [value]="profile.email" disabled>
                        <small class="text-muted">Email cannot be changed</small>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Role</label>
                        <input type="text" class="form-control" [value]="profile.role" disabled>
                      </div>
                    </div>
                  </div>

                  <!-- Personal Info (editable) -->
                  <div class="mb-4">
                    <h6 class="text-muted border-bottom pb-2 mb-3">Personal Information</h6>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label">First Name *</label>
                        <input type="text" class="form-control" [(ngModel)]="editProfile.firstName" name="firstName" required>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Last Name *</label>
                        <input type="text" class="form-control" [(ngModel)]="editProfile.lastName" name="lastName" required>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Phone Number *</label>
                        <input type="tel" class="form-control" [(ngModel)]="editProfile.phoneNumber" name="phoneNumber" required>
                      </div>
                      <div class="col-md-6">
                        <label class="form-label">Account Created</label>
                        <input type="text" class="form-control" [value]="profile.createdAt | date:'mediumDate'" disabled>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary" [disabled]="saving">
                      @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
                      {{ saving ? 'Saving...' : 'Save Changes' }}
                    </button>
                    <button type="button" class="btn btn-outline-secondary" (click)="resetForm()">Reset</button>
                  </div>
                </form>

                <hr class="my-4">

                <!-- Change Password Section -->
                <div>
                  <h6 class="text-muted border-bottom pb-2 mb-3">Change Password</h6>
                  
                  @if (passwordSuccess) {
                    <div class="alert alert-success alert-dismissible py-2">
                      <i class="bi bi-check-circle me-2"></i>{{ passwordSuccess }}
                      <button type="button" class="btn-close" (click)="passwordSuccess = ''"></button>
                    </div>
                  }
                  @if (passwordError) {
                    <div class="alert alert-danger alert-dismissible py-2">
                      <i class="bi bi-exclamation-circle me-2"></i>{{ passwordError }}
                      <button type="button" class="btn-close" (click)="passwordError = ''"></button>
                    </div>
                  }
                  
                  <form (ngSubmit)="changePassword()">
                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="form-label">Current Password</label>
                        <div class="input-group">
                          <input [type]="showCurrentPassword ? 'text' : 'password'" class="form-control" 
                                 [(ngModel)]="passwordForm.currentPassword" name="currentPassword">
                          <button type="button" class="btn btn-outline-secondary" (click)="showCurrentPassword = !showCurrentPassword">
                            <i class="bi" [ngClass]="showCurrentPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">New Password</label>
                        <div class="input-group">
                          <input [type]="showNewPassword ? 'text' : 'password'" class="form-control" 
                                 [(ngModel)]="passwordForm.newPassword" name="newPassword" minlength="6">
                          <button type="button" class="btn btn-outline-secondary" (click)="showNewPassword = !showNewPassword">
                            <i class="bi" [ngClass]="showNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                        <small class="text-muted">Min. 6 characters</small>
                      </div>
                      <div class="col-md-4">
                        <label class="form-label">Confirm New Password</label>
                        <div class="input-group">
                          <input [type]="showConfirmPassword ? 'text' : 'password'" class="form-control" 
                                 [(ngModel)]="passwordForm.confirmPassword" name="confirmPassword">
                          <button type="button" class="btn btn-outline-secondary" (click)="showConfirmPassword = !showConfirmPassword">
                            <i class="bi" [ngClass]="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    @if (passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
                      <small class="text-danger d-block mt-2">Passwords do not match</small>
                    }
                    <div class="mt-3">
                      <button type="submit" class="btn btn-warning" [disabled]="changingPassword || !isPasswordFormValid()">
                        @if (changingPassword) { <span class="spinner-border spinner-border-sm me-1"></span> }
                        {{ changingPassword ? 'Changing Password...' : 'Change Password' }}
                      </button>
                    </div>
                  </form>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .input-group .btn { border-color: #dee2e6; }
    .input-group .btn:hover { background-color: #e9ecef; }
  `]
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  loading = true;
  saving = false;
  changingPassword = false;
  success = '';
  error = '';
  passwordSuccess = '';
  passwordError = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  profile: User | null = null;
  editProfile = {
    firstName: '',
    lastName: '',
    phoneNumber: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.api.get<any>('/auth/me').subscribe({
      next: (res) => {
        if (res.success) {
          this.profile = res.data;
          this.resetForm();
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  resetForm() {
    if (this.profile) {
      this.editProfile = {
        firstName: this.profile.firstName || '',
        lastName: this.profile.lastName || '',
        phoneNumber: this.profile.phoneNumber || ''
      };
    }
  }

  saveProfile() {
    if (!this.editProfile.firstName || !this.editProfile.lastName || !this.editProfile.phoneNumber) {
      this.error = 'First name, last name and phone are required';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    this.api.put<any>('/auth/profile', {
      firstName: this.editProfile.firstName,
      lastName: this.editProfile.lastName,
      phoneNumber: this.editProfile.phoneNumber
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.success = 'Profile updated successfully';
          this.profile = res.data;
          this.resetForm();
        } else {
          this.error = res.message || 'Failed to update profile';
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.saving = false;
      }
    });
  }

  isPasswordFormValid(): boolean {
    return !!(
      this.passwordForm.currentPassword &&
      this.passwordForm.newPassword &&
      this.passwordForm.newPassword.length >= 6 &&
      this.passwordForm.newPassword === this.passwordForm.confirmPassword
    );
  }

  changePassword() {
    if (!this.isPasswordFormValid()) return;

    this.changingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    console.log('Attempting to change password...');

    this.api.post<boolean>('/auth/change-password', {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword,
      confirmPassword: this.passwordForm.confirmPassword
    }).subscribe({
      next: (res) => {
        console.log('Change password response:', res);
        if (res.success) {
          this.passwordSuccess = 'Password changed successfully!';
          this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
          this.showCurrentPassword = false;
          this.showNewPassword = false;
          this.showConfirmPassword = false;
        } else {
          this.passwordError = res.message || 'Failed to change password';
        }
        this.changingPassword = false;
      },
      error: (err: any) => {
        console.error('Change password error:', err);
        this.passwordError = err.error?.message || 'Failed to change password. Please check your current password.';
        this.changingPassword = false;
      }
    });
  }
}

