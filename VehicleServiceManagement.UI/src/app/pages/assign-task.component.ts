import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Technician, ServiceRequest, PagedResult } from '../core/models';

@Component({
  selector: 'app-assign-task',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 col-xl-10">
          <div class="d-flex align-items-center mb-4">
            <a routerLink="/app/technicians" class="btn btn-outline-secondary me-3">
              <i class="bi bi-arrow-left"></i>
            </a>
            <h4 class="mb-0">Assign Task to Technician</h4>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              @if (error) {
                <div class="alert alert-danger">{{ error }}</div>
              }
              @if (success) {
                <div class="alert alert-success">{{ success }}</div>
              }

              @if (loading) {
                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
              }

              @if (!loading) {
                <form (ngSubmit)="submit()">
                  <!-- Service Request Selection -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold">Service Request <span class="text-danger">*</span></label>
                    <select class="form-select form-select-lg" [(ngModel)]="form.serviceRequestId" name="serviceRequestId" required>
                      <option value="">-- Select a service request --</option>
                      @for (sr of serviceRequests; track sr.serviceRequestId) {
                        <option [value]="sr.serviceRequestId">
                          #{{ sr.serviceRequestId }} - {{ sr.vehicleInfo }} | {{ sr.customerName }} | {{ sr.priority }}
                        </option>
                      }
                    </select>
                    @if (serviceRequests.length === 0) {
                      <div class="alert alert-info mt-2 mb-0">
                        <i class="bi bi-info-circle me-2"></i>No unassigned service requests available
                      </div>
                    }
                  </div>

                  <!-- Selected Service Request Details -->
                  @if (selectedRequest) {
                    <div class="card bg-light border-0 mb-4">
                      <div class="card-body">
                        <h6 class="card-title text-primary mb-3">
                          <i class="bi bi-clipboard-check me-2"></i>Service Request Details
                        </h6>
                        <div class="row g-3">
                          <div class="col-md-6">
                            <small class="text-muted d-block">Customer</small>
                            <span class="fw-medium">{{ selectedRequest.customerName }}</span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">Vehicle</small>
                            <span class="fw-medium">{{ selectedRequest.vehicleInfo }}</span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">Priority</small>
                            <span class="badge" [ngClass]="selectedRequest.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                              {{ selectedRequest.priority }}
                            </span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">Scheduled Date</small>
                            <span class="fw-medium">{{ selectedRequest.scheduledDate | date:'mediumDate' }}</span>
                          </div>
                          <div class="col-12">
                            <small class="text-muted d-block">Issue Description</small>
                            <span>{{ selectedRequest.issueDescription || 'N/A' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Technician Selection -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold">Technician <span class="text-danger">*</span></label>
                    <select class="form-select form-select-lg" [(ngModel)]="form.technicianId" name="technicianId" required>
                      <option value="">-- Select a technician --</option>
                      @for (tech of technicians; track tech.userId) {
                        <option [value]="tech.userId">
                          T-{{ tech.userId }} | {{ tech.fullName }} ({{ tech.activeAssignments }} active)
                        </option>
                      }
                    </select>
                  </div>

                  <!-- Selected Technician Details -->
                  @if (selectedTechnician) {
                    <div class="card bg-light border-0 mb-4">
                      <div class="card-body">
                        <h6 class="card-title text-success mb-3">
                          <i class="bi bi-person-badge me-2"></i>Technician Details
                        </h6>
                        <div class="row g-3">
                          <div class="col-md-6">
                            <small class="text-muted d-block">Name</small>
                            <span class="fw-medium">{{ selectedTechnician.fullName }}</span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">ID</small>
                            <span class="badge bg-secondary">T-{{ selectedTechnician.userId }}</span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">Email</small>
                            <span>{{ selectedTechnician.email }}</span>
                          </div>
                          <div class="col-md-6">
                            <small class="text-muted d-block">Phone</small>
                            <span>{{ selectedTechnician.phoneNumber }}</span>
                          </div>
                          <div class="col-12">
                            <small class="text-muted d-block">Current Workload</small>
                            <span class="badge bg-warning me-1">{{ selectedTechnician.activeAssignments }} Active</span>
                            <span class="badge bg-success">{{ selectedTechnician.completedAssignments }} Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  }

                  <!-- Notes -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold">Notes <span class="text-muted fw-normal">(optional)</span></label>
                    <textarea 
                      class="form-control" 
                      [(ngModel)]="form.notes" 
                      name="notes"
                      rows="4" 
                      placeholder="Add any special instructions or notes for the technician..."></textarea>
                  </div>

                  <!-- Action Buttons -->
                  <div class="d-flex justify-content-between pt-3 border-top">
                    <a routerLink="/app/technicians" class="btn btn-outline-secondary btn-lg">
                      <i class="bi bi-x-lg me-2"></i>Cancel
                    </a>
                    <button 
                      type="submit" 
                      class="btn btn-primary btn-lg" 
                      [disabled]="saving || !form.serviceRequestId || !form.technicianId">
                      @if (saving) { 
                        <span class="spinner-border spinner-border-sm me-2"></span>Assigning...
                      } @else {
                        <i class="bi bi-check-lg me-2"></i>Assign Task
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssignTaskComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  serviceRequests: ServiceRequest[] = [];
  technicians: Technician[] = [];
  loading = true;
  saving = false;
  error = '';
  success = '';

  form = {
    serviceRequestId: '',
    technicianId: '',
    notes: ''
  };

  get selectedRequest(): ServiceRequest | null {
    if (!this.form.serviceRequestId) return null;
    return this.serviceRequests.find(sr => sr.serviceRequestId === Number.parseInt(this.form.serviceRequestId)) || null;
  }

  get selectedTechnician(): Technician | null {
    if (!this.form.technicianId) return null;
    return this.technicians.find(t => t.userId === Number.parseInt(this.form.technicianId)) || null;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      requests: this.api.get<PagedResult<ServiceRequest>>('/servicerequests', { status: 'Requested' }),
      technicians: this.api.get<Technician[]>('/users/technicians')
    }).subscribe({
      next: ({ requests, technicians }) => {
        if (requests?.success) {
          this.serviceRequests = requests.data.items;
        }
        if (technicians?.success) {
          this.technicians = technicians.data;
        }
        const requestId = this.route.snapshot.queryParamMap.get('requestId');
        if (requestId) {
          this.form.serviceRequestId = requestId;
        }
        const technicianId = this.route.snapshot.queryParamMap.get('technicianId');
        if (technicianId) {
          this.form.technicianId = technicianId;
        }

        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load data';
        this.loading = false;
      }
    });
  }

  submit() {
    if (!this.form.serviceRequestId || !this.form.technicianId) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    this.api.post('/serviceassignments', {
      serviceRequestId: Number.parseInt(this.form.serviceRequestId),
      technicianId: Number.parseInt(this.form.technicianId),
      notes: this.form.notes || null
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.success = 'Task assigned successfully! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/app/technicians']);
          }, 1500);
        } else {
          this.error = res.message || 'Failed to assign task';
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to assign task';
        this.saving = false;
      }
    });
  }
}
