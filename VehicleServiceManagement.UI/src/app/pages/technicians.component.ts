import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Technician, ServiceAssignment } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

interface TechnicianWithAssignments extends Technician {
  assignments: ServiceAssignment[];
  expanded: boolean;
}

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Technicians & Task Management</h4>
      </div>

      <!-- Search Bar -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0" 
                       placeholder="Search technicians by name, email, phone..." 
                       [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" (click)="searchTerm = ''; applyFilter()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            <div class="col-md-6 text-md-end">
              <span class="text-muted">{{ filteredTechnicians.length }} of {{ technicians.length }} technicians</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && filteredTechnicians.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-people fs-1 text-muted"></i>
          <p class="text-muted mt-2">No technicians found</p>
        </div>
      }

      @if (!loading && filteredTechnicians.length > 0) {
        <div class="row">
          @for (tech of paginatedTechnicians; track tech.userId) {
            <div class="col-12 mb-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                  <div class="d-flex align-items-center">
                    <div class="avatar bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 45px; height: 45px;">
                      <i class="bi bi-person-fill fs-5"></i>
                    </div>
                    <div>
                      <h6 class="mb-0"><span class="badge bg-secondary me-2">T-{{ tech.userId }}</span>{{ tech.fullName }}</h6>
                      <small class="text-muted">{{ tech.email }} | {{ tech.phoneNumber }}</small>
                    </div>
                  </div>
                  <div class="d-flex align-items-center gap-3">
                    <div class="text-center">
                      <span class="badge bg-primary fs-6">{{ tech.activeAssignments + tech.completedAssignments }}</span>
                      <small class="d-block text-muted">Total</small>
                    </div>
                    <div class="text-center">
                      <span class="badge bg-warning fs-6">{{ tech.activeAssignments }}</span>
                      <small class="d-block text-muted">Active</small>
                    </div>
                    <div class="text-center">
                      <span class="badge bg-success fs-6">{{ tech.completedAssignments }}</span>
                      <small class="d-block text-muted">Done</small>
                    </div>
                    <a [routerLink]="['/app/assign-task']" [queryParams]="{technicianId: tech.userId}" class="btn btn-primary btn-sm ms-2">
                      <i class="bi bi-plus-lg me-1"></i>Assign Task
                    </a>
                    <button class="btn btn-sm btn-outline-secondary" (click)="tech.expanded = !tech.expanded">
                      <i class="bi" [ngClass]="tech.expanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                    </button>
                  </div>
                </div>
                
                @if (tech.expanded) {
                  <div class="card-body p-0">
                    @if (tech.assignments.length === 0) {
                      <div class="text-center py-4 text-muted">
                        <i class="bi bi-inbox fs-3"></i>
                        <p class="mb-0 mt-2">No assignments yet</p>
                      </div>
                    } @else {
                      <div class="table-responsive">
                        <table class="table table-hover mb-0">
                          <thead class="table-light">
                            <tr>
                              <th>Assignment #</th>
                              <th>Service Request #</th>
                              <th>Status</th>
                              <th>Assigned Date</th>
                              <th>Started</th>
                              <th>Completed</th>
                              <th>Notes</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (a of tech.assignments; track a.assignmentId) {
                              <tr>
                                <td>{{ a.assignmentId }}</td>
                                <td><span class="badge bg-secondary">#{{ a.serviceRequestId }}</span></td>
                                <td><span class="badge" [ngClass]="getStatusClass(a.status)">{{ a.status }}</span></td>
                                <td>{{ a.assignedDate | date:'short' }}</td>
                                <td>{{ a.startedDate ? (a.startedDate | date:'short') : '-' }}</td>
                                <td>{{ a.completedDate ? (a.completedDate | date:'short') : '-' }}</td>
                                <td>{{ a.notes || '-' }}</td>
                                <td>
                                  <div class="btn-group btn-group-sm">
                                    <button class="btn btn-outline-primary" (click)="openEditModal(a, tech)" title="Edit">
                                      <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-outline-danger" (click)="deleteAssignment(a, tech)" [disabled]="a.status === 'Completed'" title="Delete">
                                      <i class="bi bi-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
        <app-pagination
          [currentPage]="currentPage"
          [pageSize]="pageSize"
          [totalItems]="filteredTechnicians.length"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      }
    </div>

    <!-- Edit Assignment Modal -->
    @if (showEditModal && editForm) {
      <div class="modal show d-block" style="background: rgba(0,0,0,0.5)">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Assignment #{{ editForm.assignmentId }}</h5>
              <button class="btn-close" (click)="closeModals()"></button>
            </div>
            <div class="modal-body">
              @if (modalError) {
                <div class="alert alert-danger">{{ modalError }}</div>
              }
              <div class="mb-3">
                <label class="form-label">Reassign to Technician</label>
                <select class="form-select" [(ngModel)]="editForm.technicianId">
                  @for (tech of technicians; track tech.userId) {
                    <option [value]="tech.userId">T-{{ tech.userId }} | {{ tech.fullName }} ({{ tech.activeAssignments }} active)</option>
                  }
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Notes</label>
                <textarea class="form-control" [(ngModel)]="editForm.notes" rows="3"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeModals()">Cancel</button>
              <button class="btn btn-primary" (click)="updateAssignment()" [disabled]="saving">
                @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class TechniciansComponent implements OnInit {
  private readonly api = inject(ApiService);

  technicians: TechnicianWithAssignments[] = [];
  filteredTechnicians: TechnicianWithAssignments[] = [];
  loading = true;
  saving = false;
  modalError = '';
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;

  showEditModal = false;

  editForm: {
    assignmentId: number;
    technicianId: number;
    notes: string;
    originalTechnicianId: number;
  } | null = null;

  ngOnInit() {
    this.loadData();
  }

  get paginatedTechnicians(): TechnicianWithAssignments[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTechnicians.slice(start, start + this.pageSize);
  }

  applyFilter() {
    if (!this.searchTerm.trim()) {
      this.filteredTechnicians = [...this.technicians];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTechnicians = this.technicians.filter(t =>
        t.fullName?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.phoneNumber?.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  loadData() {
    this.loading = true;
    this.api.get<Technician[]>('/users/technicians').subscribe({
      next: res => {
        if (res.success) {
          this.technicians = res.data.map(t => ({
            ...t,
            assignments: [],
            expanded: false
          }));
          this.applyFilter();
          this.loadAssignments();
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  loadAssignments() {
    this.api.get<ServiceAssignment[]>('/serviceassignments').subscribe({
      next: res => {
        if (res.success) {
          for (const tech of this.technicians) {
            tech.assignments = res.data.filter(a => a.technicianId === tech.userId);
          }
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  openEditModal(assignment: ServiceAssignment, tech: TechnicianWithAssignments) {
    this.showEditModal = true;
    this.modalError = '';
    this.editForm = {
      assignmentId: assignment.assignmentId,
      technicianId: assignment.technicianId,
      notes: assignment.notes || '',
      originalTechnicianId: tech.userId
    };
  }

  closeModals() {
    this.showEditModal = false;
    this.modalError = '';
    this.editForm = null;
  }

  updateAssignment() {
    if (!this.editForm) return;

    this.saving = true;
    this.modalError = '';

    this.api.put<ServiceAssignment>(`/serviceassignments/${this.editForm.assignmentId}`, {
      technicianId: this.editForm.technicianId,
      notes: this.editForm.notes || null
    }).subscribe({
      next: res => {
        if (res.success) {
          this.closeModals();
          this.loadData();
        } else {
          this.modalError = res.message || 'Failed to update assignment';
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.modalError = err.error?.message || 'Failed to update assignment';
        this.saving = false;
      }
    });
  }

  deleteAssignment(assignment: ServiceAssignment, tech: TechnicianWithAssignments) {
    if (assignment.status === 'Completed') return;

    if (!confirm(`Are you sure you want to delete assignment #${assignment.assignmentId}?`)) return;

    this.api.delete(`/serviceassignments/${assignment.assignmentId}`).subscribe({
      next: res => {
        if (res.success) {
          tech.assignments = tech.assignments.filter(a => a.assignmentId !== assignment.assignmentId);
          if (assignment.status === 'Assigned' || assignment.status === 'InProgress') {
            tech.activeAssignments = Math.max(0, tech.activeAssignments - 1);
          }
        }
      }
    });
  }
}
