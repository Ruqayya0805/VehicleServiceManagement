import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { User } from '../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">User Management</h4>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="bi bi-plus-lg me-1"></i>Create Staff Account
        </button>
      </div>



      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      <!-- Pending Staff Registrations Section -->
      @if (pendingStaff.length > 0) {
        <div class="card border-0 shadow-sm mb-4 border-warning">
          <div class="card-header bg-warning bg-opacity-10 border-bottom border-warning">
            <h6 class="mb-0"><i class="bi bi-clock-history me-2"></i>Pending Staff Registrations ({{ pendingStaff.length }})</h6>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of pendingStaff; track u.userId) {
                  <tr>
                    <td>{{ u.userId }}</td>
                    <td>{{ u.firstName }} {{ u.lastName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.phoneNumber }}</td>
                    <td><span class="badge" [ngClass]="getRoleBadge(u.role)">{{ getRoleDisplay(u.role) }}</span></td>
                    <td>{{ u.createdAt | date:'short' }}</td>
                    <td>
                      <button class="btn btn-sm btn-success me-1" (click)="approveStaff(u)" [disabled]="u.approving" title="Approve">
                        @if (u.approving) { <span class="spinner-border spinner-border-sm"></span> }
                        @else { <i class="bi bi-check-lg"></i> Approve }
                      </button>
                      <button class="btn btn-sm btn-outline-danger" (click)="rejectStaff(u)" [disabled]="u.rejecting" title="Reject">
                        @if (u.rejecting) { <span class="spinner-border spinner-border-sm"></span> }
                        @else { <i class="bi bi-x-lg"></i> Reject }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (!loading) {
        <!-- Staff Section -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom">
            <h6 class="mb-0">Staff Users (Admin, Service Manager, Technician)</h6>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (u of staffUsers; track u.userId) {
                  <tr>
                    <td>{{ u.userId }}</td>
                    <td>{{ u.firstName }} {{ u.lastName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.phoneNumber }}</td>
                    <td><span class="badge" [ngClass]="getRoleBadge(u.role)">{{ getRoleDisplay(u.role) }}</span></td>
                    <td>
                      @if (canToggleStatus(u)) {
                        <div class="form-check form-switch">
                          <input class="form-check-input" type="checkbox" [checked]="u.isActive" 
                                 (change)="toggleStatus(u)" [disabled]="u.toggling" role="switch">
                          <label class="form-check-label small" [class.text-success]="u.isActive" [class.text-muted]="!u.isActive">
                            {{ u.isActive ? 'Active' : 'Inactive' }}
                          </label>
                        </div>
                      } @else {
                        <span class="badge" [ngClass]="u.isActive ? 'bg-success' : 'bg-secondary'">{{ u.isActive ? 'Active' : 'Inactive' }}</span>
                      }
                    </td>
                    <td>
                      @if (canEdit(u)) {
                        <button class="btn btn-sm btn-outline-primary me-1" (click)="editUser(u)" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </button>
                      }
                      @if (canDelete(u)) {
                        <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(u)" title="Delete">
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                      @if (!canEdit(u) && !canDelete(u)) {
                        <span class="text-muted small">—</span>
                      }
                    </td>
                  </tr>
                }
                @if (staffUsers.length === 0) {
                  <tr><td colspan="7" class="text-center text-muted py-3">No staff users found</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Customers Section (read-only) -->
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Customers (Self-Registered)</h6>
            <small class="text-muted">Customers manage their own profiles</small>
          </div>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (u of customerUsers; track u.userId) {
                  <tr>
                    <td>{{ u.userId }}</td>
                    <td>{{ u.firstName }} {{ u.lastName }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.phoneNumber }}</td>
                    <td><span class="badge" [ngClass]="u.isActive ? 'bg-success' : 'bg-secondary'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
                  </tr>
                }
                @if (customerUsers.length === 0) {
                  <tr><td colspan="5" class="text-center text-muted py-3">No customers registered yet</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showCreateModal || showEditModal) {
        <div class="modal-backdrop" (click)="closeModals()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ showEditModal ? 'Edit Staff User' : 'Create Staff Account' }}</h5>
                <button type="button" class="btn-close" (click)="closeModals()"></button>
              </div>
              <div class="modal-body">
                @if (modalError) {
                  <div class="alert alert-danger">{{ modalError }}</div>
                }
                @if (!showEditModal) {
                  <div class="alert alert-light border">
                    <small>
                      <i class="bi bi-key me-1"></i>
                      The user will use these credentials to log in. Share them securely.
                    </small>
                  </div>
                }
                <form>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label">First Name *</label>
                      <input type="text" class="form-control" [(ngModel)]="formData.firstName" name="firstName" required>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Last Name *</label>
                      <input type="text" class="form-control" [(ngModel)]="formData.lastName" name="lastName" required>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-control" [(ngModel)]="formData.email" name="email" required [disabled]="showEditModal">
                    @if (showEditModal) {
                      <small class="text-muted">Email cannot be changed</small>
                    }
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-control" [(ngModel)]="formData.phoneNumber" name="phoneNumber" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Role *</label>
                    <select class="form-select" [(ngModel)]="formData.role" name="role" required>
                      <option value="">Select Role</option>
                      <option value="ServiceManager">Service Manager - Assigns tasks, monitors workload</option>
                      <option value="Technician">Technician - Updates service status, completes work</option>
                    </select>
                  </div>
                  @if (!showEditModal) {
                    <div class="mb-3">
                      <label class="form-label">Password *</label>
                      <input type="password" class="form-control" [(ngModel)]="formData.password" name="password" required minlength="6">
                      <small class="text-muted">Minimum 6 characters. Share this securely with the user.</small>
                    </div>
                  }
                  @if (showEditModal) {
                    <div class="mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="formData.isActive" name="isActive" id="isActive">
                        <label class="form-check-label" for="isActive">Active Account</label>
                      </div>
                    </div>
                  }
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="closeModals()">Cancel</button>
                <button type="button" class="btn btn-primary" (click)="submitForm()" [disabled]="saving">
                  @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ showEditModal ? 'Update User' : 'Create Account' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal && userToDelete) {
        <div class="modal-backdrop" (click)="closeModals()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Delete User</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeModals()"></button>
              </div>
              <div class="modal-body">
                @if (modalError) {
                  <div class="alert alert-danger">{{ modalError }}</div>
                }
                <p>Are you sure you want to delete this user?</p>
                <div class="bg-light p-3 rounded">
                  <strong>{{ userToDelete.firstName }} {{ userToDelete.lastName }}</strong><br>
                  <span class="text-muted">{{ userToDelete.email }}</span><br>
                  <span class="badge mt-2" [ngClass]="getRoleBadge(userToDelete.role)">{{ getRoleDisplay(userToDelete.role) }}</span>
                </div>
                <p class="text-danger mt-3 mb-0"><small><i class="bi bi-exclamation-circle me-1"></i>This action cannot be undone.</small></p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="closeModals()">Cancel</button>
                <button type="button" class="btn btn-danger" (click)="deleteUser()" [disabled]="deleting">
                  @if (deleting) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ deleting ? 'Deleting...' : 'Delete User' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; }
    .modal { z-index: 1050; }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  users: User[] = [];
  pendingStaff: any[] = [];
  loading = true;
  saving = false;
  deleting = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  modalError = '';
  editingUserId: number | null = null;
  userToDelete: User | null = null;

  formData: any = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
    isActive: true
  };

  get currentUserId(): number | undefined {
    return this.authService.currentUser?.userId;
  }

  get staffUsers(): any[] {
    const staffRoles = ['admin', 'servicemanager', 'technician'];
    return this.users.filter(u => u.role && staffRoles.includes(u.role.toLowerCase().trim()) && !(u as any).isPendingApproval);
  }

  get customerUsers(): User[] {
    return this.users.filter(u => u.role?.toLowerCase().trim() === 'customer');
  }

  ngOnInit() {
    this.loadUsers();
    this.loadPendingStaff();
  }

  loadUsers() {
    this.loading = true;
    this.api.get<User[]>('/users').subscribe({
      next: (res) => { this.users = res.success ? res.data : []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadPendingStaff() {
    this.api.get<any[]>('/users/pending-approvals').subscribe({
      next: (res) => { this.pendingStaff = res.success ? res.data : []; },
      error: () => { this.pendingStaff = []; }
    });
  }

  approveStaff(user: any) {
    user.approving = true;
    this.api.post<any>(`/users/${user.userId}/approve`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadUsers();
          this.loadPendingStaff();
        }
        user.approving = false;
      },
      error: () => { user.approving = false; }
    });
  }

  rejectStaff(user: any) {
    if (!confirm(`Are you sure you want to reject ${user.firstName} ${user.lastName}'s registration? This will delete their account.`)) {
      return;
    }
    user.rejecting = true;
    this.api.post<any>(`/users/${user.userId}/reject`, {}).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadPendingStaff();
        }
        user.rejecting = false;
      },
      error: () => { user.rejecting = false; }
    });
  }

  canToggleStatus(user: User): boolean {
    if (user.role === 'Admin') return false;
    if (user.role === 'Customer') return false;
    if (user.userId === this.currentUserId) return false;
    return true;
  }

  toggleStatus(user: any) {
    user.toggling = true;
    this.api.put<User>(`/users/${user.userId}`, {
      isActive: !user.isActive
    }).subscribe({
      next: (res) => {
        if (res.success) {
          user.isActive = !user.isActive;
        }
        user.toggling = false;
      },
      error: () => { user.toggling = false; }
    });
  }
  canEdit(user: User): boolean {
    if (user.role === 'Customer') return false;
    if (user.userId === this.currentUserId) return false;
    return user.role === 'Technician' || user.role === 'ServiceManager';
  }
  canDelete(user: User): boolean {
    if (user.role === 'Customer') return false;
    if (user.role === 'Admin') return false;
    if (user.userId === this.currentUserId) return false;
    return user.role === 'Technician' || user.role === 'ServiceManager';
  }

  openCreateModal() {
    this.resetForm();
    this.showCreateModal = true;
  }

  editUser(user: User) {
    if (!this.canEdit(user)) return;
    this.editingUserId = user.userId;
    this.formData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive
    };
    this.showEditModal = true;
  }

  confirmDelete(user: User) {
    if (!this.canDelete(user)) return;
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.modalError = '';
    this.editingUserId = null;
    this.userToDelete = null;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: '',
      password: '',
      isActive: true
    };
  }

  submitForm() {
    if (!this.formData.firstName || !this.formData.lastName || !this.formData.email || !this.formData.role) {
      this.modalError = 'Please fill all required fields.';
      return;
    }

    if (!this.showEditModal && (!this.formData.password || this.formData.password.length < 6)) {
      this.modalError = 'Password must be at least 6 characters.';
      return;
    }

    this.saving = true;
    this.modalError = '';

    if (this.showEditModal && this.editingUserId) {
      this.api.put<User>(`/users/${this.editingUserId}`, {
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        phoneNumber: this.formData.phoneNumber,
        role: this.formData.role,
        isActive: this.formData.isActive
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsers();
            this.closeModals();
          } else {
            this.modalError = res.message || 'Update failed';
          }
          this.saving = false;
        },
        error: (err: any) => {
          this.modalError = err.error?.message || 'Update failed';
          this.saving = false;
        }
      });
    } else {
      this.api.post<User>('/users', {
        firstName: this.formData.firstName,
        lastName: this.formData.lastName,
        email: this.formData.email,
        phoneNumber: this.formData.phoneNumber,
        role: this.formData.role,
        password: this.formData.password
      }).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadUsers();
            this.closeModals();
          } else {
            this.modalError = res.message || 'Creation failed';
          }
          this.saving = false;
        },
        error: (err: any) => {
          this.modalError = err.error?.message || 'Creation failed';
          this.saving = false;
        }
      });
    }
  }

  deleteUser() {
    if (!this.userToDelete || !this.canDelete(this.userToDelete)) return;

    this.deleting = true;
    this.modalError = '';

    this.api.delete<boolean>(`/users/${this.userToDelete.userId}`).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadUsers();
          this.closeModals();
        } else {
          this.modalError = res.message || 'Delete failed';
        }
        this.deleting = false;
      },
      error: (err: any) => {
        this.modalError = err.error?.message || 'Delete failed';
        this.deleting = false;
      }
    });
  }

  getRoleBadge(role: string): string {
    switch (role) {
      case 'Admin': return 'bg-danger';
      case 'ServiceManager': return 'bg-primary';
      case 'Technician': return 'bg-success';
      default: return 'bg-info';
    }
  }

  getRoleDisplay(role: string): string {
    switch (role) {
      case 'ServiceManager': return 'Service Manager';
      default: return role;
    }
  }
}
