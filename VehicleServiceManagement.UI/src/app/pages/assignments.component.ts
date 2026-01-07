import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { ServiceAssignment, ServiceRequest, Part, ServicePart, Bill, ServiceTask as ServiceTaskModel } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';
interface DisplayTask {
  id: number;
  type: 'category' | 'task';
  description: string;
  price: number;
  completed: boolean;
  serviceTaskId?: number;
}

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div>
      <!-- Work Panel View -->
      @if (selectedAssignment) {
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button class="btn btn-outline-secondary me-3" (click)="closeWorkPanel()">
              <i class="bi bi-arrow-left me-1"></i>Back to Assignments
            </button>
            <span class="h4 mb-0">
              <i class="bi bi-tools me-2"></i>Work Panel - Assignment #{{ selectedAssignment.assignmentId }}
            </span>
          </div>
          <div>
            @if (!loadingDetails && allTasksCompleted) {
              <button class="btn btn-success" (click)="completeAssignment()" [disabled]="completing">
                @if (completing) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                <i class="bi bi-check-circle me-1"></i>Complete Assignment
              </button>
            }
          </div>
        </div>

        <!-- Assignment Info Card -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-md-3">
                <small class="text-muted">Vehicle</small>
                <p class="mb-0 fw-medium">{{ selectedAssignment.vehicleInfo }}</p>
              </div>
              <div class="col-md-3">
                <small class="text-muted">Customer</small>
                <p class="mb-0 fw-medium">{{ selectedAssignment.customerName }}</p>
              </div>
              <div class="col-md-3">
                <small class="text-muted">Started</small>
                <p class="mb-0 fw-medium">{{ selectedAssignment.startedDate | date:'medium' }}</p>
              </div>
              <div class="col-md-3">
                <small class="text-muted">Priority</small>
                <p class="mb-0">
                  <span class="badge" [ngClass]="{
                    'bg-danger': selectedAssignment.priority === 'Urgent',
                    'bg-warning text-dark': selectedAssignment.priority === 'High',
                    'bg-info': selectedAssignment.priority === 'Normal',
                    'bg-secondary': selectedAssignment.priority === 'Low'
                  }">{{ selectedAssignment.priority }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        @if (loadingDetails) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="text-muted mt-2">Loading service details...</p>
          </div>
        } @else {
          <div class="row g-4">
            <!-- Left Column: Service Tasks -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-list-check me-2"></i>Service Tasks</h6>
                </div>
                <div class="card-body">
                  @if (displayTasks.length === 0) {
                    <div class="text-center text-muted py-3">
                      <i class="bi bi-inbox fs-3"></i>
                      <p class="mb-0">No tasks found</p>
                    </div>
                  } @else {
                    <div class="list-group list-group-flush">
                      @for (task of displayTasks; track task.id; let i = $index) {
                        <div class="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                          <div class="form-check d-flex align-items-center">
                            @if (task.type === 'task') {
                              <input class="form-check-input" type="checkbox" 
                                [id]="'task-' + i" 
                                [checked]="task.completed"
                                (change)="toggleTaskCompletion(task)"
                                [disabled]="togglingTaskId === task.serviceTaskId"
                                style="width: 1.25em; height: 1.25em;">
                            } @else {
                              <input class="form-check-input" type="checkbox" 
                                [id]="'task-' + i" 
                                [(ngModel)]="task.completed"
                                style="width: 1.25em; height: 1.25em;">
                            }
                            <label class="form-check-label ms-2" [for]="'task-' + i"
                              [class.text-decoration-line-through]="task.completed"
                              [class.text-muted]="task.completed">
                              {{ task.description }}
                              @if (task.type === 'task') {
                                <span class="badge bg-info ms-1" style="font-size: 0.7em;">Custom</span>
                              }
                            </label>
                            @if (togglingTaskId === task.serviceTaskId) {
                              <span class="spinner-border spinner-border-sm ms-2 text-primary"></span>
                            }
                          </div>
                          <div>
                            @if (task.price > 0) {
                              <span class="badge bg-secondary">₹{{ task.price | number:'1.0-0' }}</span>
                            }
                            @if (task.completed) {
                              <i class="bi bi-check-circle-fill text-success ms-2"></i>
                            }
                          </div>
                        </div>
                      }
                    </div>
                    
                    <div class="mt-4 p-3 bg-light rounded">
                      <div class="d-flex justify-content-between mb-2">
                        <span>Completed:</span>
                        <strong>{{ completedTasksCount }} / {{ displayTasks.length }}</strong>
                      </div>
                      <div class="progress" style="height: 10px;">
                        <div class="progress-bar bg-success" [style.width.%]="completionPercentage"></div>
                      </div>
                      <div class="text-center mt-2">
                        <small class="text-muted">{{ completionPercentage | number:'1.0-0' }}% Complete</small>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right Column: Parts Used -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0"><i class="bi bi-box-seam me-2"></i>Parts Used</h6>
                  <button class="btn btn-sm btn-primary" (click)="showAddPart = true" [disabled]="showAddPart">
                    <i class="bi bi-plus-lg me-1"></i>Add Part
                  </button>
                </div>
                <div class="card-body">
                  <!-- Add Part Form -->
                  @if (showAddPart) {
                    <div class="border rounded p-3 mb-3 bg-light">
                      <h6 class="mb-3">Add Part</h6>
                      <div class="mb-3">
                        <label class="form-label">Select Part</label>
                        <select class="form-select" [(ngModel)]="newPart.partId" (change)="onPartSelect()">
                          <option [ngValue]="0">-- Select a part --</option>
                          @for (p of availableParts; track p.partId) {
                            <option [ngValue]="p.partId">{{ p.partName }} ({{ p.partNumber }}) - ₹{{ p.unitPrice }} - Stock: {{ p.quantityInStock }}</option>
                          }
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Quantity</label>
                        <input type="number" class="form-control" [(ngModel)]="newPart.quantity" min="1" [max]="selectedPartStock">
                        @if (selectedPartStock > 0) {
                          <small class="text-muted">Available: {{ selectedPartStock }}</small>
                        }
                      </div>
                      @if (newPart.partId && newPart.quantity > 0) {
                        <div class="alert alert-info py-2 mb-3">
                          <strong>Total: ₹{{ getSelectedPartPrice() * newPart.quantity | number:'1.0-0' }}</strong>
                        </div>
                      }
                      <div class="d-flex gap-2">
                        <button class="btn btn-success" (click)="addPart()" 
                          [disabled]="!newPart.partId || newPart.quantity < 1 || addingPart">
                          @if (addingPart) {
                            <span class="spinner-border spinner-border-sm me-1"></span>
                          }
                          Add
                        </button>
                        <button class="btn btn-outline-secondary" (click)="cancelAddPart()">Cancel</button>
                      </div>
                    </div>
                  }

                  <!-- Parts List -->
                  @if (usedParts.length === 0 && !showAddPart) {
                    <div class="text-center text-muted py-4">
                      <i class="bi bi-box fs-1"></i>
                      <p class="mb-0 mt-2">No parts added yet</p>
                    </div>
                  } @else if (usedParts.length > 0) {
                    <div class="table-responsive">
                      <table class="table table-sm mb-0">
                        <thead class="table-light">
                          <tr>
                            <th>Part</th>
                            <th class="text-center">Qty</th>
                            <th class="text-end">Price</th>
                            <th class="text-end">Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (part of usedParts; track part.servicePartId) {
                            <tr>
                              <td>
                                <div>{{ part.partName }}</div>
                                <small class="text-muted">{{ part.partNumber }}</small>
                              </td>
                              <td class="text-center">{{ part.quantityUsed }}</td>
                              <td class="text-end">₹{{ part.unitPrice | number:'1.0-0' }}</td>
                              <td class="text-end fw-bold">₹{{ part.totalPrice | number:'1.0-0' }}</td>
                              <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger" (click)="removePart(part)" 
                                  [disabled]="removingPartId === part.servicePartId">
                                  @if (removingPartId === part.servicePartId) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="bi bi-trash"></i>
                                  }
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                        <tfoot class="table-light">
                          <tr>
                            <th colspan="3" class="text-end">Total Parts Cost:</th>
                            <th class="text-end text-success">₹{{ totalPartsCost | number:'1.0-0' }}</th>
                            <th></th>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Technician Notes -->
          <div class="card border-0 shadow-sm mt-4">
            <div class="card-header bg-white py-3">
              <h6 class="mb-0"><i class="bi bi-journal-text me-2"></i>Technician Notes</h6>
            </div>
            <div class="card-body">
              <textarea class="form-control" rows="3" [(ngModel)]="technicianNotes" 
                placeholder="Add notes about the service performed, issues found, recommendations, etc."></textarea>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <button class="btn btn-outline-secondary" (click)="closeWorkPanel()">
              <i class="bi bi-arrow-left me-1"></i>Back to Assignments
            </button>
            @if (allTasksCompleted) {
              <button class="btn btn-success btn-lg" (click)="completeAssignment()" [disabled]="completing">
                @if (completing) {
                  <span class="spinner-border spinner-border-sm me-1"></span>
                }
                <i class="bi bi-check-circle me-1"></i>Complete Assignment
              </button>
            } @else {
              <div class="text-muted">
                <i class="bi bi-info-circle me-1"></i>Complete all tasks to finish this assignment
              </div>
            }
          </div>
        }
      } @else {
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0">{{ isTechnician ? 'My Assignments' : 'Service Assignments' }}</h4>
          @if (!isTechnician) {
            <div class="btn-group">
              <button class="btn" [ngClass]="statusFilter === '' ? 'btn-primary' : 'btn-outline-primary'" 
                      (click)="setStatusFilter('')">
                All <span class="badge bg-light text-dark ms-1">{{ assignments.length }}</span>
              </button>
              <button class="btn" [ngClass]="statusFilter === 'Assigned' ? 'btn-warning' : 'btn-outline-warning'" 
                      (click)="setStatusFilter('Assigned')">
                Assigned <span class="badge bg-light text-dark ms-1">{{ getCountByStatus('Assigned') }}</span>
              </button>
              <button class="btn" [ngClass]="statusFilter === 'InProgress' ? 'btn-info' : 'btn-outline-info'" 
                      (click)="setStatusFilter('InProgress')">
                In Progress <span class="badge bg-light text-dark ms-1">{{ getCountByStatus('InProgress') }}</span>
              </button>
              <button class="btn" [ngClass]="statusFilter === 'Completed' ? 'btn-success' : 'btn-outline-success'" 
                      (click)="setStatusFilter('Completed')">
                Completed <span class="badge bg-light text-dark ms-1">{{ getCountByStatus('Completed') }}</span>
              </button>
            </div>
          }
        </div>

        <!-- Search Bar -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body py-3">
            <div class="row g-3 align-items-center">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                  <input type="text" class="form-control border-start-0" 
                         placeholder="Search by customer, vehicle, technician, ID..." 
                         [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
                  @if (searchTerm) {
                    <button class="btn btn-outline-secondary" (click)="searchTerm = ''; applyFilters()">
                      <i class="bi bi-x-lg"></i>
                    </button>
                  }
                </div>
              </div>
              <div class="col-md-6 text-md-end">
                <span class="text-muted">{{ searchedAssignments.length }} of {{ assignments.length }} assignments</span>
              </div>
            </div>
          </div>
        </div>

        @if (loading) {
          <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        }

        @if (!loading && searchedAssignments.length === 0) {
          <div class="text-center py-5">
            <i class="bi bi-inbox fs-1 text-muted"></i>
            <p class="text-muted mt-2">No assignments found</p>
          </div>
        }

        @if (!loading && assignments.length > 0 && !isTechnician && filteredAssignments.length === 0) {
          <div class="text-center py-5">
            <i class="bi bi-funnel fs-1 text-muted"></i>
            <p class="text-muted mt-2">No {{ statusFilter }} assignments found</p>
            <button class="btn btn-outline-primary btn-sm" (click)="setStatusFilter('')">Clear Filter</button>
          </div>
        }

        @if (!loading && searchedAssignments.length > 0) {
          <!-- Assignment Cards for Technician -->
          @if (isTechnician) {
            <div class="row g-4">
              @for (a of paginatedSearchedAssignments; track a.assignmentId) {
                <div class="col-12">
                  <div class="card border-0 shadow-sm" [class.border-start]="true" [class.border-4]="true"
                    [class.border-warning]="a.status === 'Assigned'"
                    [class.border-primary]="a.status === 'InProgress'"
                    [class.border-success]="a.status === 'Completed'">
                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 class="mb-1">
                          <i class="bi bi-clipboard-check me-2"></i>Assignment #{{ a.assignmentId }}
                          <span class="badge ms-2" [ngClass]="getStatusClass(a.status)">{{ a.status === 'InProgress' ? 'In Progress' : a.status }}</span>
                          @if (a.priority === 'Urgent') {
                            <span class="badge bg-danger ms-1">Urgent</span>
                          }
                        </h6>
                        <small class="text-muted">Service Request #{{ a.serviceRequestId }} • {{ a.vehicleInfo }} • {{ a.customerName }}</small>
                      </div>
                      <div class="d-flex gap-2">
                        @if (a.status === 'Assigned') {
                          <button class="btn btn-success" (click)="startAssignment(a)" [disabled]="updating === a.assignmentId">
                            @if (updating === a.assignmentId) {
                              <span class="spinner-border spinner-border-sm me-1"></span>
                            }
                            <i class="bi bi-play-fill me-1"></i>Start Work
                          </button>
                        }
                        @if (a.status === 'InProgress') {
                          <button class="btn btn-primary" (click)="openWorkPanel(a)">
                            <i class="bi bi-tools me-1"></i>Work Panel
                          </button>
                        }
                        @if (a.status === 'Completed') {
                          @if (a.isClosed) {
                            <span class="badge bg-dark fs-6"><i class="bi bi-lock-fill me-1"></i>Closed</span>
                          } @else {
                            <button class="btn btn-warning" (click)="reopenAssignment(a)" [disabled]="updating === a.assignmentId">
                              @if (updating === a.assignmentId) {
                                <span class="spinner-border spinner-border-sm me-1"></span>
                              }
                              <i class="bi bi-arrow-counterclockwise me-1"></i>Reopen
                            </button>
                          }
                          <span class="text-success ms-2"><i class="bi bi-check-circle-fill fs-4"></i></span>
                        }
                      </div>
                    </div>
                    
                    @if (a.status !== 'Assigned') {
                      <div class="card-body">
                        <div class="row">
                          <div class="col-md-6">
                            <p class="mb-1"><strong>Started:</strong> {{ a.startedDate | date:'medium' }}</p>
                            @if (a.completedDate) {
                              <p class="mb-1"><strong>Completed:</strong> {{ a.completedDate | date:'medium' }}</p>
                            }
                          </div>
                          <div class="col-md-6">
                            @if (a.notes) {
                              <p class="mb-1"><strong>Notes:</strong> {{ a.notes }}</p>
                            }
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
            <app-pagination
              [currentPage]="currentPage"
              [pageSize]="pageSize"
              [totalItems]="searchedAssignments.length"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          } @else {
            <!-- Enhanced Card view for Admin/Manager -->
            <div class="row g-4">
              @for (a of paginatedFilteredAssignments; track a.assignmentId) {
                <div class="col-12">
                  <div class="card border-0 shadow-sm" [class.border-start]="true" [class.border-4]="true"
                    [class.border-warning]="a.status === 'Assigned'"
                    [class.border-primary]="a.status === 'InProgress'"
                    [class.border-success]="a.status === 'Completed'">
                    <div class="card-body">
                      <div class="row align-items-center">
                        <div class="col-md-1">
                          <span class="badge bg-light text-dark fs-6">#{{ a.assignmentId }}</span>
                        </div>
                        <div class="col-md-3">
                          <small class="text-muted d-block">Service Request</small>
                          <strong>SR #{{ a.serviceRequestId }}</strong>
                          @if (a.vehicleInfo) {
                            <div class="small text-muted">{{ a.vehicleInfo }}</div>
                          }
                        </div>
                        <div class="col-md-2">
                          <small class="text-muted d-block">Customer</small>
                          <strong>{{ a.customerName || 'N/A' }}</strong>
                        </div>
                        <div class="col-md-2">
                          <small class="text-muted d-block">Technician</small>
                          <strong>{{ a.technicianName }}</strong>
                        </div>
                        <div class="col-md-2">
                          <small class="text-muted d-block">Status</small>
                          <span class="badge" [ngClass]="getStatusClass(a.status)">
                            {{ a.status === 'InProgress' ? 'In Progress' : a.status }}
                          </span>
                          @if (a.priority === 'Urgent') {
                            <span class="badge bg-danger ms-1">Urgent</span>
                          }
                        </div>
                        <div class="col-md-2 text-end">
                          @if (a.status === 'Completed') {
                            <small class="text-success d-block">
                              <i class="bi bi-check-circle-fill me-1"></i>Completed
                            </small>
                            <small class="text-muted">{{ a.completedDate | date:'shortDate' }}</small>
                            @if (a.hasBill) {
                              <button class="btn btn-sm btn-outline-primary mt-2" (click)="viewBill(a)">
                                <i class="bi bi-receipt me-1"></i>View Bill
                              </button>
                              @if (a.isClosed) {
                                <span class="badge bg-dark ms-1">Closed</span>
                              }
                            } @else {
                              <button class="btn btn-sm btn-primary mt-2" (click)="generateBill(a)" 
                                [disabled]="generatingBillFor === a.assignmentId">
                                @if (generatingBillFor === a.assignmentId) {
                                  <span class="spinner-border spinner-border-sm me-1"></span>
                                }
                                <i class="bi bi-receipt me-1"></i>Generate Bill
                              </button>
                            }
                          } @else if (a.status === 'InProgress') {
                            <small class="text-primary d-block">
                              <i class="bi bi-gear-wide-connected me-1"></i>Started
                            </small>
                            <small class="text-muted">{{ a.startedDate | date:'shortDate' }}</small>
                          } @else {
                            <small class="text-muted d-block">Assigned</small>
                            <small class="text-muted">{{ a.assignedDate | date:'shortDate' }}</small>
                          }
                        </div>
                      </div>
                      @if (a.notes) {
                        <div class="mt-2 pt-2 border-top">
                          <small class="text-muted"><i class="bi bi-sticky me-1"></i>Notes: {{ a.notes }}</small>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
            <app-pagination
              [currentPage]="currentPage"
              [pageSize]="pageSize"
              [totalItems]="filteredAssignments.length"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          }
        }
      }
    </div>
  `
})
export class AssignmentsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  assignments: ServiceAssignment[] = [];
  loading = true;
  updating: number | null = null;
  statusFilter = '';
  searchTerm = '';
  generatingBillFor: number | null = null;
  currentPage = 1;
  pageSize = 10;
  selectedAssignment: ServiceAssignment | null = null;
  serviceRequest: ServiceRequest | null = null;
  loadingDetails = false;
  displayTasks: DisplayTask[] = [];
  togglingTaskId: number | null = null;
  usedParts: ServicePart[] = [];
  availableParts: Part[] = [];
  technicianNotes = '';
  completing = false;
  showAddPart = false;
  addingPart = false;
  removingPartId: number | null = null;
  newPart = { partId: 0, quantity: 1 };
  selectedPartStock = 0;

  get isTechnician() { return this.authService.isTechnician(); }

  get completedTasksCount(): number {
    return this.displayTasks.filter(t => t.completed).length;
  }

  get completionPercentage(): number {
    return this.displayTasks.length > 0
      ? (this.completedTasksCount / this.displayTasks.length) * 100
      : 0;
  }

  get allTasksCompleted(): boolean {
    return this.displayTasks.length > 0 && this.displayTasks.every(t => t.completed);
  }

  get totalPartsCost(): number {
    return this.usedParts.reduce((sum, p) => sum + p.totalPrice, 0);
  }

  ngOnInit() {
    this.loadAssignments();
  }

  loadAssignments() {
    this.loading = true;
    this.api.get<ServiceAssignment[]>('/serviceassignments').subscribe({
      next: res => {
        this.assignments = res.success ? res.data : [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  startAssignment(a: ServiceAssignment) {
    this.updating = a.assignmentId;
    this.api.put<ServiceAssignment>(`/serviceassignments/${a.assignmentId}/status`, {
      status: 'InProgress',
      notes: 'Started work'
    }).subscribe({
      next: res => {
        if (res.success) {
          a.status = res.data.status;
          a.startedDate = res.data.startedDate;
        }
        this.updating = null;
      },
      error: () => this.updating = null
    });
  }

  reopenAssignment(a: ServiceAssignment) {
    this.updating = a.assignmentId;
    this.api.put<ServiceAssignment>(`/serviceassignments/${a.assignmentId}/status`, {
      status: 'Reopen',
      notes: 'Reopened assignment for additional work'
    }).subscribe({
      next: res => {
        if (res.success) {
          a.status = res.data.status;
          a.completedDate = undefined;
          a.notes = res.data.notes;
        }
        this.updating = null;
      },
      error: (err) => {
        this.updating = null;
        const message = err?.error?.message || 'Cannot reopen this assignment';
        alert(message);
      }
    });
  }

  openWorkPanel(a: ServiceAssignment) {
    this.selectedAssignment = a;
    this.loadingDetails = true;
    this.displayTasks = [];
    this.usedParts = [];
    this.technicianNotes = a.notes || '';
    this.api.get<ServiceRequest>(`/servicerequests/${a.serviceRequestId}`).subscribe({
      next: res => {
        if (res.success) {
          this.serviceRequest = res.data;
          this.displayTasks = [];
          let taskId = 0;
          if (res.data.selectedServices && res.data.selectedServices.length > 0) {
            for (const s of res.data.selectedServices) {
              this.displayTasks.push({
                id: taskId++,
                type: 'category',
                description: s.categoryName,
                price: s.basePrice,
                completed: false
              });
            }
          }
          if (res.data.tasks && res.data.tasks.length > 0) {
            for (const t of res.data.tasks) {
              this.displayTasks.push({
                id: taskId++,
                type: 'task',
                description: t.description,
                price: t.price || 0,
                completed: t.isCompleted,
                serviceTaskId: t.serviceTaskId
              });
            }
          }
        }
        this.loadUsedParts();
      },
      error: () => {
        this.loadingDetails = false;
      }
    });
    this.api.get<Part[]>('/parts').subscribe({
      next: res => {
        this.availableParts = res.success ? res.data.filter(p => p.quantityInStock > 0) : [];
      }
    });
  }

  loadUsedParts() {
    if (!this.selectedAssignment) return;

    this.api.get<ServicePart[]>(`/serviceparts/service-request/${this.selectedAssignment.serviceRequestId}`).subscribe({
      next: res => {
        this.usedParts = res.success ? res.data : [];
        this.loadingDetails = false;
      },
      error: () => {
        this.usedParts = [];
        this.loadingDetails = false;
      }
    });
  }

  closeWorkPanel() {
    this.selectedAssignment = null;
    this.serviceRequest = null;
    this.displayTasks = [];
    this.usedParts = [];
    this.showAddPart = false;
    this.technicianNotes = '';
  }

  toggleTaskCompletion(task: DisplayTask) {
    if (task.type !== 'task' || !task.serviceTaskId) return;

    this.togglingTaskId = task.serviceTaskId;
    this.api.put<any>(`/servicetasks/${task.serviceTaskId}/toggle`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          task.completed = res.data.isCompleted;
        }
        this.togglingTaskId = null;
      },
      error: () => {
        this.togglingTaskId = null;
      }
    });
  }

  onPartSelect() {
    const part = this.availableParts.find(p => p.partId === this.newPart.partId);
    this.selectedPartStock = part?.quantityInStock || 0;
    this.newPart.quantity = 1;
  }

  getSelectedPartPrice(): number {
    const part = this.availableParts.find(p => p.partId === this.newPart.partId);
    return part?.unitPrice || 0;
  }

  addPart() {
    if (!this.selectedAssignment || !this.newPart.partId || this.newPart.quantity < 1) return;

    this.addingPart = true;
    this.api.post<ServicePart>('/serviceparts', {
      serviceRequestId: this.selectedAssignment.serviceRequestId,
      partId: this.newPart.partId,
      quantityUsed: this.newPart.quantity
    }).subscribe({
      next: res => {
        if (res.success) {
          const existingIndex = this.usedParts.findIndex(p => p.servicePartId === res.data.servicePartId);
          if (existingIndex >= 0) {
            this.usedParts[existingIndex] = res.data;
          } else {
            this.usedParts.push(res.data);
          }
          const part = this.availableParts.find(p => p.partId === this.newPart.partId);
          if (part) {
            part.quantityInStock -= this.newPart.quantity;
            if (part.quantityInStock <= 0) {
              this.availableParts = this.availableParts.filter(p => p.partId !== this.newPart.partId);
            }
          }
        }
        this.cancelAddPart();
        this.addingPart = false;
      },
      error: () => this.addingPart = false
    });
  }

  cancelAddPart() {
    this.showAddPart = false;
    this.newPart = { partId: 0, quantity: 1 };
    this.selectedPartStock = 0;
  }

  removePart(part: ServicePart) {
    this.removingPartId = part.servicePartId;
    this.api.delete(`/serviceparts/${part.servicePartId}`).subscribe({
      next: () => {
        this.usedParts = this.usedParts.filter(p => p.servicePartId !== part.servicePartId);
        const availablePart = this.availableParts.find(p => p.partId === part.partId);
        if (availablePart) {
          availablePart.quantityInStock += part.quantityUsed;
        } else {
          this.api.get<Part[]>('/parts').subscribe({
            next: res => {
              this.availableParts = res.success ? res.data.filter(p => p.quantityInStock > 0) : [];
            }
          });
        }
        this.removingPartId = null;
      },
      error: () => this.removingPartId = null
    });
  }

  completeAssignment() {
    if (!this.selectedAssignment) return;

    this.completing = true;
    this.api.put<ServiceAssignment>(`/serviceassignments/${this.selectedAssignment.assignmentId}/status`, {
      status: 'Completed',
      notes: this.technicianNotes || 'Service completed'
    }).subscribe({
      next: res => {
        if (res.success) {
          const assignment = this.assignments.find(a => a.assignmentId === this.selectedAssignment!.assignmentId);
          if (assignment) {
            assignment.status = res.data.status;
            assignment.completedDate = res.data.completedDate;
            assignment.notes = res.data.notes;
          }
          this.closeWorkPanel();
        }
        this.completing = false;
      },
      error: () => this.completing = false
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Assigned': return 'bg-warning text-dark';
      case 'InProgress': return 'bg-primary';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
  setStatusFilter(status: string) {
    this.statusFilter = status;
    this.currentPage = 1;
  }

  getCountByStatus(status: string): number {
    return this.assignments.filter(a => a.status === status).length;
  }

  applyFilters() {
    this.currentPage = 1;
  }

  get searchedAssignments(): ServiceAssignment[] {
    let result = [...this.assignments];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(a =>
        a.customerName?.toLowerCase().includes(term) ||
        a.vehicleInfo?.toLowerCase().includes(term) ||
        a.technicianName?.toLowerCase().includes(term) ||
        String(a.assignmentId).includes(term) ||
        String(a.serviceRequestId).includes(term)
      );
    }

    // Sort: new ones (Assigned/InProgress) first, then reopenable (Completed but not closed), then closed
    result.sort((a, b) => {
      const getPriority = (assignment: ServiceAssignment): number => {
        // New/Active assignments (Assigned or InProgress) - highest priority
        if (assignment.status === 'Assigned' || assignment.status === 'InProgress') {
          return 0;
        }
        // Completed but not closed (reopenable) - medium priority
        if (assignment.status === 'Completed' && !assignment.isClosed) {
          return 1;
        }
        // Closed assignments - lowest priority
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });

    return result;
  }

  get filteredAssignments(): ServiceAssignment[] {
    if (!this.statusFilter) return this.searchedAssignments;
    return this.searchedAssignments.filter(a => a.status === this.statusFilter);
  }

  get paginatedAssignments(): ServiceAssignment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.assignments.slice(start, start + this.pageSize);
  }

  get paginatedSearchedAssignments(): ServiceAssignment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.searchedAssignments.slice(start, start + this.pageSize);
  }

  get paginatedFilteredAssignments(): ServiceAssignment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAssignments.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  viewBill(a: ServiceAssignment) {
    if (a.billId) {
      this.router.navigate(['/app/bills', a.billId]);
    }
  }

  generateBill(a: ServiceAssignment) {
    this.generatingBillFor = a.assignmentId;
    this.api.post<Bill>(`/bills/generate/${a.serviceRequestId}`, {}).subscribe({
      next: res => {
        this.generatingBillFor = null;
        if (res.success) {
          a.hasBill = true;
          a.billId = res.data.billId;
          this.router.navigate(['/app/bills', res.data.billId]);
        }
      },
      error: (err) => {
        this.generatingBillFor = null;
        if (err?.error?.message?.includes('already exists')) {
          this.api.get<Bill[]>(`/bills?serviceRequestId=${a.serviceRequestId}`).subscribe({
            next: billsRes => {
              if (billsRes.success && billsRes.data.length > 0) {
                const billId = (billsRes.data[0] as any).billId;
                a.hasBill = true;
                a.billId = billId;
                this.router.navigate(['/app/bills', billId]);
              }
            }
          });
        } else {
          alert(err?.error?.message || 'Failed to generate bill');
        }
      }
    });
  }
}
