import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ServiceRequest, PagedResult, Technician } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Service Requests</h4>
        @if (isCustomer) {
          <button class="btn btn-primary" (click)="showCreateModal = true">
            <i class="bi bi-plus-lg me-1"></i>New Request
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0" 
                       placeholder="Search by customer, vehicle, service..." 
                       [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" (click)="searchTerm = ''; applyFilters()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            @if (isAdmin || isManager) {
              <div class="col-md-2">
                <select class="form-select" [(ngModel)]="statusFilter" (change)="load()">
                  <option value="">All Statuses</option>
                  <option value="Requested">Requested</option>
                  <option value="Assigned">Assigned</option>
                  <option value="InProgress">InProgress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div class="col-md-2">
                <select class="form-select" [(ngModel)]="priorityFilter" (change)="load()">
                  <option value="">All Priorities</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            }
            <div class="col text-end">
              <span class="text-muted">{{ filteredRequests.length }} of {{ requests.length }} requests</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && filteredRequests.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-inbox fs-1 text-muted"></i>
          <p class="text-muted mt-2">No service requests found</p>
        </div>
      }

      @if (!loading && filteredRequests.length > 0) {
        <div class="card border-0 shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="sortable" (click)="sort('serviceRequestId')">#
                    <i class="bi ms-1" [ngClass]="getSortIcon('serviceRequestId')"></i>
                  </th>
                  <th class="sortable" (click)="sort('customerName')">Customer
                    <i class="bi ms-1" [ngClass]="getSortIcon('customerName')"></i>
                  </th>
                  <th class="sortable" (click)="sort('vehicleInfo')">Vehicle
                    <i class="bi ms-1" [ngClass]="getSortIcon('vehicleInfo')"></i>
                  </th>
                  <th>Service</th>
                  <th class="sortable" (click)="sort('status')">Status
                    <i class="bi ms-1" [ngClass]="getSortIcon('status')"></i>
                  </th>
                  <th class="sortable" (click)="sort('priority')">Priority
                    <i class="bi ms-1" [ngClass]="getSortIcon('priority')"></i>
                  </th>
                  <th>Technician</th>
                  <th class="sortable" (click)="sort('scheduledDate')">Date
                    <i class="bi ms-1" [ngClass]="getSortIcon('scheduledDate')"></i>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of paginatedRequests; track r.serviceRequestId) {
                  <tr>
                    <td>{{ r.serviceRequestId }}</td>
                    <td>{{ r.customerName }}</td>
                    <td>{{ r.vehicleInfo }}</td>
                    <td>
                      @if (isCustomIssue(r)) {
                        <span class="badge bg-warning text-dark">Custom Issue</span>
                      } @else {
                        {{ getServiceNames(r) }}
                      }
                    </td>
                    <td><span class="badge" [ngClass]="getStatusClass(r.status)">{{ r.status }}</span></td>
                    <td><span class="badge" [ngClass]="r.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">{{ r.priority }}</span></td>
                    <td>
                      @if (r.assignment?.technicianName) {
                        {{ r.assignment.technicianName }}
                      } @else if (isManager || isAdmin) {
                        <a [routerLink]="['/app/assign-task']" [queryParams]="{requestId: r.serviceRequestId}" class="text-primary text-decoration-none">
                          <i class="bi bi-plus-circle me-1"></i>Assign
                        </a>
                      } @else {
                        -
                      }
                    </td>
                    <td>{{ r.scheduledDate | date:'shortDate' }}</td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" (click)="viewDetails(r)" title="View Details">
                        <i class="bi bi-eye"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalItems]="filteredRequests.length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }

      <!-- Service Request Details Modal (Editable) -->
      @if (selectedRequest) {
        <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title">
                  <i class="bi bi-clipboard-data me-2"></i>Service Request #{{ selectedRequest.serviceRequestId }}
                  @if (canEdit) {
                    <span class="badge bg-light text-primary ms-2">Editing</span>
                  }
                </h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeDetails()"></button>
              </div>
              <div class="modal-body">
                <!-- Customer & Vehicle Info (Read-only) -->
                <div class="row mb-4">
                  <div class="col-md-6">
                    <div class="card bg-light border-0">
                      <div class="card-body">
                        <h6 class="text-primary mb-3"><i class="bi bi-person me-2"></i>Customer</h6>
                        <p class="mb-1"><strong>{{ selectedRequest.customerName }}</strong></p>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card bg-light border-0">
                      <div class="card-body">
                        <h6 class="text-primary mb-3"><i class="bi bi-car-front me-2"></i>Vehicle</h6>
                        <p class="mb-1"><strong>{{ selectedRequest.vehicleInfo }}</strong></p>
                        <small class="text-muted">{{ selectedRequest.registrationNumber }}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Issue Description (Editable for custom issues) -->
                <div class="card mb-4" [class.border-warning]="isCustomIssue(selectedRequest)">
                  <div class="card-header" [class.bg-warning]="isCustomIssue(selectedRequest)" [class.text-dark]="isCustomIssue(selectedRequest)">
                    <h6 class="mb-0">
                      @if (isCustomIssue(selectedRequest)) {
                        <i class="bi bi-exclamation-triangle me-2"></i>Custom Issue - Customer Description
                      } @else {
                        <i class="bi bi-card-text me-2"></i>Issue Description
                      }
                    </h6>
                  </div>
                  <div class="card-body">
                    <p class="mb-0" [class.fs-5]="isCustomIssue(selectedRequest)">{{ selectedRequest.issueDescription }}</p>
                  </div>
                </div>

                <!-- Services & Pricing -->
                <div class="card mb-4">
                  <div class="card-header bg-light">
                    <h6 class="mb-0"><i class="bi bi-tools me-2"></i>Services & Pricing</h6>
                  </div>
                  <div class="card-body">
                    @if (!isCustomIssue(selectedRequest)) {
                      <div class="mb-3">
                        <label class="text-muted small">Selected Services</label>
                        <div class="d-flex flex-wrap gap-2">
                          @for (s of selectedRequest.selectedServices; track s.categoryId) {
                            <span class="badge bg-primary">{{ s.categoryName }} - ₹{{ s.basePrice | number }}</span>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="alert alert-warning mb-3">
                        <i class="bi bi-info-circle me-2"></i>
                        <strong>No predefined service selected.</strong> Customer described a custom issue. Please review and set the actual price after assessment.
                      </div>
                    }

                    <!-- Task List with Prices -->
                    @if (selectedRequest.tasks && selectedRequest.tasks.length > 0) {
                      <div class="mb-4">
                        <label class="text-muted small d-flex justify-content-between">
                          <span><i class="bi bi-list-check me-1"></i>Work Items / Tasks</span>
                          <span class="badge bg-secondary">{{ getCompletedTasksCount(selectedRequest) }}/{{ selectedRequest.tasks.length }} completed</span>
                        </label>
                        <table class="table table-sm table-bordered">
                          <thead class="table-light">
                            <tr>
                              <th style="width: 40px;">Done</th>
                              <th>Task Description</th>
                              <th style="width: 150px;">Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (task of selectedRequest.tasks; track task.serviceTaskId) {
                              <tr [class.table-success]="task.isCompleted">
                                <td class="text-center">
                                  @if (task.isCompleted) {
                                    <i class="bi bi-check-circle-fill text-success"></i>
                                  } @else {
                                    <i class="bi bi-circle text-muted"></i>
                                  }
                                </td>
                                <td>
                                  <span [class.text-decoration-line-through]="task.isCompleted">{{ task.description }}</span>
                                  @if (task.isCompleted && task.completedByName) {
                                    <small class="d-block text-success">Completed by {{ task.completedByName }}</small>
                                  }
                                </td>
                                <td>
                                  @if (canEdit) {
                                    <input type="number" 
                                           class="form-control form-control-sm" 
                                           [(ngModel)]="task.price" 
                                           (blur)="updateTaskPrice(task)"
                                           min="0" 
                                           step="0.01"
                                           placeholder="0.00">
                                  } @else {
                                    ₹{{ task.price || 0 | number }}
                                  }
                                </td>
                              </tr>
                            }
                          </tbody>
                          <tfoot class="table-light">
                            <tr>
                              <th colspan="2" class="text-end">Tasks Total:</th>
                              <th>₹{{ getTasksTotal(selectedRequest) | number }}</th>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    }

                    <div class="row g-3">
                      <div class="col-md-4">
                        <label class="text-muted small d-block">Estimated Cost</label>
                        <span class="fs-5">₹{{ selectedRequest.estimatedCost | number }}</span>
                      </div>
                      <div class="col-md-4">
                        <label class="text-muted small d-block">Actual Cost</label>
                        @if (canEdit) {
                          <div class="input-group">
                            <span class="input-group-text">₹</span>
                            <input type="number" class="form-control" [(ngModel)]="editForm.actualCost" min="0" step="0.01">
                          </div>
                        } @else {
                          <span class="fs-5">₹{{ selectedRequest.actualCost | number }}</span>
                        }
                      </div>
                      <div class="col-md-4">
                        <label class="text-muted small d-block">Priority</label>
                        @if (canEdit) {
                          <select class="form-select" [(ngModel)]="editForm.priority">
                            <option value="Normal">Normal</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        } @else {
                          <span class="badge" [ngClass]="selectedRequest.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                            {{ selectedRequest.priority }}
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Status & Assignment -->
                <div class="row mb-4">
                  <div class="col-md-6">
                    <div class="card border-0 bg-light">
                      <div class="card-body">
                        <h6 class="text-muted mb-2">Status</h6>
                        @if (canEdit && selectedRequest.status !== 'Closed' && selectedRequest.status !== 'Cancelled') {
                          <select class="form-select" [(ngModel)]="editForm.status">
                            <option value="Requested">Requested</option>
                            <option value="Assigned">Assigned</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Closed">Closed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        } @else {
                          <span class="badge fs-6" [ngClass]="getStatusClass(selectedRequest.status)">{{ selectedRequest.status }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card border-0 bg-light">
                      <div class="card-body">
                        <h6 class="text-muted mb-2">Assigned Technician</h6>
                        @if (selectedRequest.assignment) {
                          <p class="mb-0"><strong>{{ selectedRequest.assignment.technicianName }}</strong></p>
                          <small class="text-muted">Assigned: {{ selectedRequest.assignment.assignedDate | date:'medium' }}</small>
                        } @else {
                          <p class="text-muted mb-0">Not yet assigned</p>
                          @if (canEdit) {
                            <a [routerLink]="['/app/assign-task']" [queryParams]="{requestId: selectedRequest.serviceRequestId}" 
                               class="btn btn-sm btn-outline-primary mt-2" (click)="closeDetails()">
                              <i class="bi bi-person-plus me-1"></i>Assign Technician
                            </a>
                          }
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Scheduled Date -->
                @if (canEdit) {
                  <div class="card mb-4">
                    <div class="card-body">
                      <div class="row g-3">
                        <div class="col-md-6">
                          <label class="form-label">Scheduled Date</label>
                          <input type="date" class="form-control" [(ngModel)]="editForm.scheduledDate">
                        </div>
                      </div>
                    </div>
                  </div>
                }

                <!-- Technician Remarks -->
                <div class="card mb-4 border-success">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="bi bi-chat-left-quote me-2"></i>Technician Remarks</h6>
                  </div>
                  <div class="card-body">
                    @if (canEdit) {
                      <textarea class="form-control" rows="3" [(ngModel)]="editForm.technicianRemarks" 
                                placeholder="Add technician notes about the service..."></textarea>
                    } @else if (selectedRequest.technicianRemarks) {
                      <p class="mb-0">{{ selectedRequest.technicianRemarks }}</p>
                    } @else {
                      <p class="text-muted mb-0">No technician remarks yet</p>
                    }
                  </div>
                </div>

                <!-- Customer Remarks -->
                <div class="card border-info">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="bi bi-chat-right-quote me-2"></i>Customer Remarks</h6>
                  </div>
                  <div class="card-body">
                    @if (canEdit) {
                      <textarea class="form-control" rows="3" [(ngModel)]="editForm.customerRemarks"
                                placeholder="Customer's additional notes..."></textarea>
                    } @else if (selectedRequest.customerRemarks) {
                      <p class="mb-0">{{ selectedRequest.customerRemarks }}</p>
                    } @else {
                      <p class="text-muted mb-0">No customer remarks</p>
                    }
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                @if (canEdit && selectedRequest.status !== 'Closed' && selectedRequest.status !== 'Cancelled') {
                  @if (saving) {
                    <button class="btn btn-success" disabled>
                      <span class="spinner-border spinner-border-sm me-2"></span>Saving...
                    </button>
                  } @else {
                    <button class="btn btn-success" (click)="saveChanges()">
                      <i class="bi bi-check-lg me-2"></i>Save Changes
                    </button>
                  }
                }
                <button type="button" class="btn btn-secondary" (click)="closeDetails()">Close</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0,0,0,0.05); }
  `]
})
export class ServiceRequestsComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  requests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  loading = true;
  statusFilter = '';
  priorityFilter = '';
  searchTerm = '';
  showCreateModal = false;
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedRequest: ServiceRequest | null = null;
  saving = false;
  editForm = {
    status: '',
    priority: '',
    actualCost: 0,
    scheduledDate: '',
    technicianRemarks: '',
    customerRemarks: ''
  };

  get isAdmin() { return this.authService.isAdmin(); }
  get isManager() { return this.authService.isManager(); }
  get isTechnician() { return this.authService.isTechnician(); }
  get isCustomer() { return this.authService.isCustomer(); }
  get canEdit() { return this.isAdmin || this.isManager; }

  get paginatedRequests(): ServiceRequest[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequests.slice(start, start + this.pageSize);
  }

  ngOnInit() { 
    this.load();
    this.route.queryParams.subscribe(params => {
      const requestId = params['id'];
      if (requestId) {
        setTimeout(() => {
          const request = this.requests.find(r => r.serviceRequestId === +requestId);
          if (request) {
            this.viewDetails(request);
          }
        }, 500);
      }
    });
  }

  load() {
    this.loading = true;
    const params: any = {};

    if (this.statusFilter) params.status = this.statusFilter;
    if (this.priorityFilter) params.priority = this.priorityFilter;

    this.api.get<PagedResult<ServiceRequest>>('/servicerequests', params).subscribe({
      next: res => {
        this.requests = res.success ? res.data.items : [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Requested': return 'bg-secondary';
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info';
      case 'Completed': return 'bg-success';
      case 'Closed': return 'bg-dark';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getServiceNames(request: ServiceRequest): string {
    if (request.selectedServices && request.selectedServices.length > 0) {
      return request.selectedServices.map(s => s.categoryName).join(', ');
    }
    return request.categoryName || 'Custom Issue (See Description)';
  }

  isCustomIssue(request: ServiceRequest): boolean {
    return (!request.selectedServices || request.selectedServices.length === 0) && !request.categoryName;
  }

  viewDetails(request: ServiceRequest) {
    this.selectedRequest = request;
    this.editForm = {
      status: request.status,
      priority: request.priority,
      actualCost: request.actualCost || 0,
      scheduledDate: request.scheduledDate ? request.scheduledDate.split('T')[0] : '',
      technicianRemarks: request.technicianRemarks || '',
      customerRemarks: request.customerRemarks || ''
    };
  }

  closeDetails() {
    this.selectedRequest = null;
  }

  saveChanges() {
    if (!this.selectedRequest) return;

    this.saving = true;

    const updateData: any = {
      actualCost: this.editForm.actualCost,
      priority: this.editForm.priority,
      status: this.editForm.status,
      technicianRemarks: this.editForm.technicianRemarks || null,
      customerRemarks: this.editForm.customerRemarks || null
    };
    if (this.editForm.scheduledDate) {
      updateData.scheduledDate = this.editForm.scheduledDate;
    }

    this.api.put<ServiceRequest>(`/servicerequests/${this.selectedRequest.serviceRequestId}`, updateData).subscribe({
      next: (res) => {
        if (res.success) {
          const idx = this.requests.findIndex(r => r.serviceRequestId === this.selectedRequest!.serviceRequestId);
          if (idx >= 0) {
            this.requests[idx] = { ...this.requests[idx], ...res.data };
          }
          this.selectedRequest = res.data;
          this.viewDetails(res.data);
        }
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.message || 'Failed to save changes');
      }
    });
  }
  getCompletedTasksCount(request: ServiceRequest): number {
    if (!request.tasks || request.tasks.length === 0) return 0;
    return request.tasks.filter(t => t.isCompleted).length;
  }

  getTasksTotal(request: ServiceRequest): number {
    if (!request.tasks || request.tasks.length === 0) return 0;
    return request.tasks.reduce((sum, t) => sum + (t.price || 0), 0);
  }

  updateTaskPrice(task: any) {
    this.api.put<any>(`/servicetasks/${task.serviceTaskId}/price`, {
      price: task.price || 0
    }).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.selectedRequest) {
            this.editForm.actualCost = this.getTasksTotal(this.selectedRequest);
          }
        }
      },
      error: () => { }
    });
  }

  applyFilters() {
    let result = [...this.requests];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.customerName?.toLowerCase().includes(term) ||
        r.vehicleInfo?.toLowerCase().includes(term) ||
        r.categoryName?.toLowerCase().includes(term) ||
        r.selectedServices?.some(s => s.categoryName?.toLowerCase().includes(term)) ||
        r.issueDescription?.toLowerCase().includes(term) ||
        String(r.serviceRequestId).includes(term)
      );
    }
    if (this.sortColumn) {
      result.sort((a, b) => {
        const aVal = (a as any)[this.sortColumn];
        const bVal = (b as any)[this.sortColumn];
        const aStr = String(aVal ?? '').toLowerCase();
        const bStr = String(bVal ?? '').toLowerCase();
        let comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
        return this.sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    this.filteredRequests = result;
    this.currentPage = 1;
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up text-muted';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }
}
