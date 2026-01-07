import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ServiceRequest } from '../../core/models';

@Component({
  selector: 'app-service-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="service-history">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-1">Service History</h4>
          <p class="text-muted mb-0">View your past and current service records</p>
        </div>
        <button class="btn btn-primary" routerLink="/app/book-service">
          <i class="bi bi-plus-lg me-2"></i>Book New Service
        </button>
      </div>

      <!-- Stats Cards -->
      @if (!loading && requests.length > 0) {
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="bi bi-clipboard-check text-primary fs-2 mb-2"></i>
                <h3 class="mb-1">{{ requests.length }}</h3>
                <small class="text-muted">Total Requests</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="bi bi-hourglass-split text-warning fs-2 mb-2"></i>
                <h3 class="mb-1">{{ pendingCount }}</h3>
                <small class="text-muted">Pending</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="bi bi-gear-wide-connected text-info fs-2 mb-2"></i>
                <h3 class="mb-1">{{ inProgressCount }}</h3>
                <small class="text-muted">In Progress</small>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body text-center">
                <i class="bi bi-check-circle text-success fs-2 mb-2"></i>
                <h3 class="mb-1">{{ completedCount }}</h3>
                <small class="text-muted">Completed</small>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0" placeholder="Search by vehicle, service..." 
                       [(ngModel)]="searchTerm" (input)="applyFilters()">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
                <option value="">All Statuses</option>
                <option value="Requested">Requested</option>
                <option value="Assigned">Assigned</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="sortBy" (change)="applyFilters()">
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" (click)="clearFilters()">
                <i class="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
          <p class="text-muted mt-3">Loading service history...</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading && requests.length === 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <div class="mb-4">
              <i class="bi bi-journal-x text-muted" style="font-size: 4rem; opacity: 0.5;"></i>
            </div>
            <h5 class="text-muted">No Service History</h5>
            <p class="text-muted mb-4">You haven't booked any services yet</p>
            <button class="btn btn-primary" routerLink="/app/book-service">
              <i class="bi bi-plus-lg me-2"></i>Book Your First Service
            </button>
          </div>
        </div>
      }

      <!-- No Results -->
      @if (!loading && requests.length > 0 && filteredRequests.length === 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <i class="bi bi-search text-muted fs-1 mb-3"></i>
            <h5 class="text-muted">No Results Found</h5>
            <p class="text-muted">Try adjusting your filters</p>
          </div>
        </div>
      }

      <!-- Service History List -->
      @if (!loading && filteredRequests.length > 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-bottom py-3">
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted">Showing {{ filteredRequests.length }} of {{ requests.length }} records</span>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width: 80px;">ID</th>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Cost</th>
                  <th style="width: 100px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (request of filteredRequests; track request.serviceRequestId) {
                  <tr [class.table-success]="request.status === 'Completed'">
                    <td>
                      <span class="badge bg-light text-dark">#{{ request.serviceRequestId }}</span>
                    </td>
                    <td>
                      <strong>{{ request.vehicleInfo }}</strong>
                      <div class="small text-muted">{{ request.registrationNumber }}</div>
                    </td>
                    <td>
                      <strong>
                        @if (request.selectedServices && request.selectedServices.length > 1) {
                          {{ getServiceNames(request) }}
                        } @else {
                          {{ request.categoryName }}
                        }
                      </strong>
                      <div class="small text-muted text-truncate" style="max-width: 200px;">
                        {{ request.issueDescription }}
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusClass(request.status)">
                        {{ request.status }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="request.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                        {{ request.priority }}
                      </span>
                    </td>
                    <td>
                      <div>{{ request.scheduledDate | date:'mediumDate' }}</div>
                      @if (request.completedDate) {
                        <div class="small text-success">
                          <i class="bi bi-check-circle me-1"></i>{{ request.completedDate | date:'shortDate' }}
                        </div>
                      }
                    </td>
                    <td>
                      <strong class="text-primary">₹{{ request.estimatedCost | number }}</strong>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" (click)="viewDetails(request)" title="View Details">
                        <i class="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Details Modal -->
      @if (showDetailsModal && selectedRequest) {
        <div class="modal-backdrop fade show" (click)="closeDetailsModal()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg">
              <div class="modal-header border-0" [ngClass]="getStatusBgClass(selectedRequest.status)">
                <h5 class="modal-title text-white">
                  <i class="bi bi-file-text me-2"></i>Service Request #{{ selectedRequest.serviceRequestId }}
                </h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeDetailsModal()"></button>
              </div>
              <div class="modal-body p-4">
                <!-- Status Banner -->
                <div class="alert d-flex align-items-center mb-4" [ngClass]="getStatusAlertClass(selectedRequest.status)">
                  <i class="bi fs-4 me-3" [ngClass]="getStatusIcon(selectedRequest.status)"></i>
                  <div>
                    <strong>{{ getStatusLabel(selectedRequest.status) }}</strong>
                    <div class="small">{{ getStatusDescription(selectedRequest.status) }}</div>
                  </div>
                </div>

                <div class="row g-4">
                  <!-- Left Column -->
                  <div class="col-md-6">
                    <div class="detail-section mb-4">
                      <h6 class="text-muted border-bottom pb-2 mb-3">
                        <i class="bi bi-info-circle me-2"></i>Request Details
                      </h6>
                      <div class="row g-2">
                        <div class="col-6">
                          <small class="text-muted">Service Type</small>
                          <div class="fw-bold">{{ selectedRequest.categoryName }}</div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Priority</small>
                          <div>
                            <span class="badge" [ngClass]="selectedRequest.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                              {{ selectedRequest.priority }}
                            </span>
                          </div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Requested Date</small>
                          <div>{{ selectedRequest.requestedDate | date:'mediumDate' }}</div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Scheduled Date</small>
                          <div>{{ selectedRequest.scheduledDate | date:'mediumDate' }}</div>
                        </div>
                        @if (selectedRequest.completedDate) {
                          <div class="col-12">
                            <small class="text-muted">Completed Date</small>
                            <div class="text-success">
                              <i class="bi bi-check-circle me-1"></i>{{ selectedRequest.completedDate | date:'medium' }}
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <!-- Right Column -->
                  <div class="col-md-6">
                    <div class="detail-section mb-4">
                      <h6 class="text-muted border-bottom pb-2 mb-3">
                        <i class="bi bi-car-front me-2"></i>Vehicle & Assignment
                      </h6>
                      <div class="row g-2">
                        <div class="col-12">
                          <small class="text-muted">Vehicle</small>
                          <div class="fw-bold">{{ selectedRequest.vehicleInfo }}</div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Registration</small>
                          <div>{{ selectedRequest.registrationNumber }}</div>
                        </div>
                        <div class="col-6">
                          <small class="text-muted">Technician</small>
                          <div>{{ selectedRequest.assignment?.technicianName || 'Not assigned' }}</div>
                        </div>
                        <div class="col-12">
                          <small class="text-muted">Estimated Cost</small>
                          <div class="h5 text-primary mb-0">₹{{ selectedRequest.estimatedCost | number }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Issue Description -->
                <div class="detail-section mb-4">
                  <h6 class="text-muted border-bottom pb-2 mb-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>Issue Description
                  </h6>
                  <p class="mb-0 bg-light p-3 rounded">{{ selectedRequest.issueDescription }}</p>
                </div>

                <!-- Customer Remarks -->
                @if (selectedRequest.customerRemarks) {
                  <div class="detail-section mb-4">
                    <h6 class="text-muted border-bottom pb-2 mb-3">
                      <i class="bi bi-chat-left me-2"></i>Your Remarks
                    </h6>
                    <p class="mb-0 bg-light p-3 rounded">{{ selectedRequest.customerRemarks }}</p>
                  </div>
                }

                <!-- Technician Remarks -->
                @if (selectedRequest.technicianRemarks) {
                  <div class="detail-section">
                    <h6 class="text-info border-bottom pb-2 mb-3">
                      <i class="bi bi-chat-left-text me-2"></i>Technician Notes
                    </h6>
                    <p class="mb-0 bg-info-subtle p-3 rounded">{{ selectedRequest.technicianRemarks }}</p>
                  </div>
                }
              </div>
              <div class="modal-footer border-0">
                @if (selectedRequest.status === 'Completed') {
                  <button type="button" class="btn btn-outline-primary" routerLink="/app/bills">
                    <i class="bi bi-receipt me-1"></i>View Bill
                  </button>
                }
                <button type="button" class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
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
    .detail-section h6 {
      font-size: 0.9rem;
    }
  `]
})
export class ServiceHistoryComponent implements OnInit {
  private api = inject(ApiService);

  requests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  loading = true;
  showDetailsModal = false;
  selectedRequest: ServiceRequest | null = null;

  searchTerm = '';
  statusFilter = '';
  sortBy = 'date-desc';

  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'Requested' || r.status === 'Assigned').length;
  }

  get inProgressCount(): number {
    return this.requests.filter(r => r.status === 'InProgress').length;
  }

  get completedCount(): number {
    return this.requests.filter(r => r.status === 'Completed').length;
  }

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.loading = true;
    this.api.get<any>('/servicerequests').subscribe({
      next: res => {
        this.requests = res.success ? (res.data.items || res.data) : [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters() {
    let filtered = [...this.requests];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.vehicleInfo?.toLowerCase().includes(term) ||
        r.categoryName?.toLowerCase().includes(term) ||
        r.registrationNumber?.toLowerCase().includes(term) ||
        r.issueDescription?.toLowerCase().includes(term)
      );
    }
    if (this.statusFilter) {
      filtered = filtered.filter(r => r.status === this.statusFilter);
    }
    switch (this.sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
        break;
      case 'status':
        const statusOrder = ['InProgress', 'Assigned', 'Requested', 'Completed'];
        filtered.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        break;
    }

    this.filteredRequests = filtered;
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.sortBy = 'date-desc';
    this.applyFilters();
  }

  getServiceNames(request: ServiceRequest): string {
    if (request.selectedServices && request.selectedServices.length > 0) {
      return request.selectedServices.map(s => s.categoryName).join(', ');
    }
    return request.categoryName || 'Custom Issue (See Description)';
  }

  viewDetails(request: ServiceRequest) {
    this.selectedRequest = request;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedRequest = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Requested': return 'bg-secondary';
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusBgClass(status: string): string {
    switch (status) {
      case 'Requested': return 'bg-secondary';
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getStatusAlertClass(status: string): string {
    switch (status) {
      case 'Requested': return 'alert-secondary';
      case 'Assigned': return 'alert-primary';
      case 'InProgress': return 'alert-info';
      case 'Completed': return 'alert-success';
      default: return 'alert-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Requested': return 'bi-hourglass-split';
      case 'Assigned': return 'bi-person-check';
      case 'InProgress': return 'bi-gear-wide-connected';
      case 'Completed': return 'bi-check-circle';
      default: return 'bi-question-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'Requested': return 'Request Submitted';
      case 'Assigned': return 'Technician Assigned';
      case 'InProgress': return 'Work In Progress';
      case 'Completed': return 'Service Completed';
      default: return status;
    }
  }

  getStatusDescription(status: string): string {
    switch (status) {
      case 'Requested': return 'Your service request is awaiting assignment to a technician.';
      case 'Assigned': return 'A technician has been assigned and will begin work soon.';
      case 'InProgress': return 'Your vehicle is currently being serviced.';
      case 'Completed': return 'The service has been completed successfully.';
      default: return '';
    }
  }
}
