import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ServiceRequest, BillSummary } from '../../core/models';

@Component({
  selector: 'app-track-service',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="track-service">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-1">Track My Services</h4>
          <p class="text-muted mb-0">Monitor the status of your active service requests</p>
        </div>
        <button class="btn btn-primary" routerLink="/app/book-service">
          <i class="bi bi-plus-lg me-2"></i>Book New Service
        </button>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
          <p class="text-muted mt-3">Loading your service requests...</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading && activeRequests.length === 0 && completedRequests.length === 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <div class="mb-4">
              <i class="bi bi-clipboard-check text-success" style="font-size: 4rem; opacity: 0.5;"></i>
            </div>
            <h5 class="text-muted">No Service Requests</h5>
            <p class="text-muted mb-4">You don't have any service requests yet</p>
            <button class="btn btn-primary" routerLink="/app/book-service">
              <i class="bi bi-plus-lg me-2"></i>Book a Service
            </button>
          </div>
        </div>
      }

      <!-- No Active Requests but has Completed -->
      @if (!loading && activeRequests.length === 0 && completedRequests.length > 0) {
        <div class="alert alert-info d-flex align-items-center mb-4">
          <i class="bi bi-info-circle me-2"></i>
          <span>No active service requests. Your completed services are shown below.</span>
        </div>
      }

      <!-- Active Service Requests -->
      @if (!loading && activeRequests.length > 0) {
        <div class="row g-4">
          @for (request of activeRequests; track request.serviceRequestId) {
            <div class="col-12">
              <div class="card service-card border-0 shadow-sm">
                <div class="card-body p-0">
                  <div class="row g-0">
                    <!-- Status Column -->
                    <div class="col-lg-3 p-4 d-flex flex-column justify-content-center" 
                         [ngClass]="getStatusBgClass(request.status)">
                      <div class="text-center text-white">
                        <i class="bi fs-1 mb-2" [ngClass]="getStatusIcon(request.status)"></i>
                        <h5 class="mb-1">{{ getStatusLabel(request.status) }}</h5>
                        <small>{{ getStatusDescription(request.status) }}</small>
                      </div>
                    </div>
                    
                    <!-- Details Column -->
                    <div class="col-lg-9 p-4">
                      <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 class="mb-1">
                            {{ getServiceNames(request) }}
                          </h5>
                          <span class="text-muted">Request #{{ request.serviceRequestId }}</span>
                        </div>
                        <span class="badge fs-6" [ngClass]="request.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                          {{ request.priority }}
                        </span>
                      </div>

                      <!-- Progress Bar -->
                      <div class="progress mb-4" style="height: 8px;">
                        <div class="progress-bar" [ngClass]="getProgressBarClass(request.status)" 
                             [style.width]="getProgressWidth(request.status) + '%'"></div>
                      </div>

                      <!-- Steps -->
                      <div class="d-flex justify-content-between mb-4">
                        <div class="step text-center" [class.active]="isStepActive(request.status, 1)" [class.completed]="isStepCompleted(request.status, 1)">
                          <div class="step-icon mb-1">
                            <i class="bi bi-send-check"></i>
                          </div>
                          <small>Requested</small>
                        </div>
                        <div class="step-line flex-grow-1 mx-2"></div>
                        <div class="step text-center" [class.active]="isStepActive(request.status, 2)" [class.completed]="isStepCompleted(request.status, 2)">
                          <div class="step-icon mb-1">
                            <i class="bi bi-person-check"></i>
                          </div>
                          <small>Assigned</small>
                        </div>
                        <div class="step-line flex-grow-1 mx-2"></div>
                        <div class="step text-center" [class.active]="isStepActive(request.status, 3)" [class.completed]="isStepCompleted(request.status, 3)">
                          <div class="step-icon mb-1">
                            <i class="bi bi-tools"></i>
                          </div>
                          <small>In Progress</small>
                        </div>
                        <div class="step-line flex-grow-1 mx-2"></div>
                        <div class="step text-center" [class.active]="isStepActive(request.status, 4)" [class.completed]="isStepCompleted(request.status, 4)">
                          <div class="step-icon mb-1">
                            <i class="bi bi-check-circle"></i>
                          </div>
                          <small>Completed</small>
                        </div>
                      </div>

                      <!-- Details Grid -->
                      <div class="row g-3">
                        <div class="col-md-4">
                          <div class="detail-box bg-light p-3 rounded h-100">
                            <div class="d-flex align-items-center">
                              <i class="bi bi-car-front text-primary me-2 fs-5"></i>
                              <div>
                                <small class="text-muted d-block">Vehicle</small>
                                <strong>{{ request.vehicleInfo }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="detail-box bg-light p-3 rounded h-100">
                            <div class="d-flex align-items-center">
                              <i class="bi bi-calendar-event text-primary me-2 fs-5"></i>
                              <div>
                                <small class="text-muted d-block">Scheduled Date</small>
                                <strong>{{ request.scheduledDate | date:'mediumDate' }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-4">
                          <div class="detail-box bg-light p-3 rounded h-100">
                            <div class="d-flex align-items-center">
                              <i class="bi bi-person-gear text-primary me-2 fs-5"></i>
                              <div>
                                <small class="text-muted d-block">Technician</small>
                                <strong>{{ request.assignment?.technicianName || 'Not assigned yet' }}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Issue Description -->
                      @if (request.issueDescription) {
                        <div class="mt-3 p-3 bg-light rounded">
                          <small class="text-muted d-block mb-1">Issue Description</small>
                          <p class="mb-0">{{ request.issueDescription }}</p>
                        </div>
                      }

                      <!-- Technician Remarks -->
                      @if (request.technicianRemarks) {
                        <div class="mt-3 p-3 bg-info-subtle rounded">
                          <small class="text-info d-block mb-1"><i class="bi bi-chat-left-text me-1"></i>Technician Notes</small>
                          <p class="mb-0">{{ request.technicianRemarks }}</p>
                        </div>
                      }

                      <!-- Estimated Cost -->
                      <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <div>
                          <small class="text-muted">Estimated Cost</small>
                          <h5 class="mb-0 text-primary">₹{{ request.estimatedCost | number }}</h5>
                        </div>
                        <div class="d-flex gap-2">
                          @if (canModifyRequest(request)) {
                            <button class="btn btn-outline-warning btn-sm" (click)="openRescheduleModal(request)">
                              <i class="bi bi-calendar-event me-1"></i>Reschedule
                            </button>
                            <button class="btn btn-outline-danger btn-sm" (click)="openCancelModal(request)">
                              <i class="bi bi-x-circle me-1"></i>Cancel
                            </button>
                          }
                          <button class="btn btn-outline-primary btn-sm" (click)="viewDetails(request)">
                            <i class="bi bi-eye me-1"></i>View Full Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Recently Completed Services (with bills) -->
      @if (!loading && completedRequests.length > 0) {
        <div class="mt-5">
          <div class="d-flex align-items-center mb-4">
            <h5 class="mb-0"><i class="bi bi-check-circle-fill text-success me-2"></i>Completed & Billed</h5>
            <span class="badge bg-success ms-2">{{ completedRequests.length }}</span>
          </div>
          <div class="row g-4">
            @for (request of completedRequests; track request.serviceRequestId) {
              <div class="col-12">
                <div class="card service-card border-0 shadow-sm border-start border-4"
                     [class.border-success]="getPaymentStatus(request.serviceRequestId) === 'Paid'"
                     [class.border-warning]="getPaymentStatus(request.serviceRequestId) === 'PartiallyPaid'"
                     [class.border-danger]="getPaymentStatus(request.serviceRequestId) === 'Pending'">
                  <div class="card-body p-0">
                    <div class="row g-0">
                      <!-- Status Column -->
                      <div class="col-lg-3 p-4 d-flex flex-column justify-content-center"
                           [ngClass]="getPaymentStatus(request.serviceRequestId) === 'Paid' ? 'bg-success' : 
                                      getPaymentStatus(request.serviceRequestId) === 'PartiallyPaid' ? 'bg-warning' : 'bg-danger'">
                        <div class="text-center text-white">
                          @if (getPaymentStatus(request.serviceRequestId) === 'Paid') {
                            <i class="bi bi-check-circle fs-1 mb-2"></i>
                            <h5 class="mb-1">Paid</h5>
                          } @else if (getPaymentStatus(request.serviceRequestId) === 'PartiallyPaid') {
                            <i class="bi bi-hourglass-split fs-1 mb-2"></i>
                            <h5 class="mb-1">Partially Paid</h5>
                          } @else {
                            <i class="bi bi-credit-card fs-1 mb-2"></i>
                            <h5 class="mb-1">Payment Pending</h5>
                          }
                          <small>{{ request.completedDate | date:'mediumDate' }}</small>
                        </div>
                      </div>
                      
                      <!-- Details Column -->
                      <div class="col-lg-9 p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 class="mb-1">{{ getServiceNames(request) }}</h5>
                            <span class="text-muted">Request #{{ request.serviceRequestId }}</span>
                          </div>
                          <div class="d-flex gap-2">
                            <span class="badge fs-6" [ngClass]="getPaymentStatusClass(request.serviceRequestId)">
                              {{ getPaymentStatus(request.serviceRequestId) === 'PartiallyPaid' ? 'Partial Payment' : getPaymentStatus(request.serviceRequestId) }}
                            </span>
                          </div>
                        </div>

                        <!-- Completion Progress -->
                        <div class="progress mb-4" style="height: 8px;">
                          <div class="progress-bar bg-success" style="width: 100%"></div>
                        </div>

                        <!-- Details Grid -->
                        <div class="row g-3">
                          <div class="col-md-4">
                            <div class="detail-box bg-light p-3 rounded h-100">
                              <div class="d-flex align-items-center">
                                <i class="bi bi-car-front text-primary me-2 fs-5"></i>
                                <div>
                                  <small class="text-muted d-block">Vehicle</small>
                                  <strong>{{ request.vehicleInfo }}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-4">
                            <div class="detail-box bg-light p-3 rounded h-100">
                              <div class="d-flex align-items-center">
                                <i class="bi bi-calendar-check text-success me-2 fs-5"></i>
                                <div>
                                  <small class="text-muted d-block">Completed On</small>
                                  <strong>{{ request.completedDate | date:'mediumDate' }}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-4">
                            <div class="detail-box bg-light p-3 rounded h-100">
                              <div class="d-flex align-items-center">
                                <i class="bi bi-person-gear text-primary me-2 fs-5"></i>
                                <div>
                                  <small class="text-muted d-block">Technician</small>
                                  <strong>{{ request.assignment?.technicianName || 'N/A' }}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Technician Remarks -->
                        @if (request.technicianRemarks) {
                          <div class="mt-3 p-3 bg-success-subtle rounded">
                            <small class="text-success d-block mb-1"><i class="bi bi-chat-left-text me-1"></i>Technician Notes</small>
                            <p class="mb-0">{{ request.technicianRemarks }}</p>
                          </div>
                        }

                        <!-- Cost and Actions -->
                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                          <div>
                            <small class="text-muted">Bill Amount</small>
                            <h5 class="mb-0 text-primary">₹{{ getBillAmount(request.serviceRequestId) | number:'1.0-0' }}</h5>
                            @if (getBalanceDue(request.serviceRequestId) > 0) {
                              <small class="text-danger">Balance: ₹{{ getBalanceDue(request.serviceRequestId) | number:'1.0-0' }}</small>
                            }
                          </div>
                          <div class="d-flex gap-2">
                            @if (getBalanceDue(request.serviceRequestId) > 0) {
                              <button class="btn btn-success" (click)="payNow(request)">
                                <i class="bi bi-credit-card me-1"></i>Pay Now
                              </button>
                            }
                            <button class="btn btn-outline-primary btn-sm" (click)="payNow(request)">
                              <i class="bi bi-receipt me-1"></i>View Bill
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" (click)="viewDetails(request)">
                              <i class="bi bi-eye me-1"></i>Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Request Details Modal -->
      @if (showDetailsModal && selectedRequest) {
        <div class="modal-backdrop fade show" (click)="closeDetailsModal()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow-lg">
              <div class="modal-header border-0" [ngClass]="getStatusBgClass(selectedRequest.status)">
                <h5 class="modal-title text-white">
                  <i class="bi bi-clipboard-data me-2"></i>Service Request #{{ selectedRequest.serviceRequestId }}
                </h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeDetailsModal()"></button>
              </div>
              <div class="modal-body p-4">
                <div class="row g-4">
                  <div class="col-md-6">
                    <h6 class="text-muted mb-3">Request Information</h6>
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="text-muted" style="width: 40%;">Status</td>
                        <td><span class="badge" [ngClass]="getStatusBadgeClass(selectedRequest.status)">{{ selectedRequest.status }}</span></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Priority</td>
                        <td><span class="badge" [ngClass]="selectedRequest.priority === 'Urgent' ? 'bg-danger' : 'bg-secondary'">{{ selectedRequest.priority }}</span></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Service Type</td>
                        <td><strong>{{ selectedRequest.categoryName }}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Requested</td>
                        <td>{{ selectedRequest.requestedDate | date:'medium' }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted">Scheduled</td>
                        <td>{{ selectedRequest.scheduledDate | date:'medium' }}</td>
                      </tr>
                      @if (selectedRequest.completedDate) {
                        <tr>
                          <td class="text-muted">Completed</td>
                          <td>{{ selectedRequest.completedDate | date:'medium' }}</td>
                        </tr>
                      }
                    </table>
                  </div>
                  <div class="col-md-6">
                    <h6 class="text-muted mb-3">Vehicle & Assignment</h6>
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="text-muted" style="width: 40%;">Vehicle</td>
                        <td><strong>{{ selectedRequest.vehicleInfo }}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Reg. Number</td>
                        <td>{{ selectedRequest.registrationNumber }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted">Technician</td>
                        <td>{{ selectedRequest.assignment?.technicianName || 'Not assigned' }}</td>
                      </tr>
                      <tr>
                        <td class="text-muted">Est. Cost</td>
                        <td><strong class="text-primary">₹{{ selectedRequest.estimatedCost | number }}</strong></td>
                      </tr>
                    </table>
                  </div>
                </div>

                @if (selectedRequest.issueDescription) {
                  <div class="mt-4 p-3 bg-light rounded">
                    <h6 class="text-muted mb-2">Issue Description</h6>
                    <p class="mb-0">{{ selectedRequest.issueDescription }}</p>
                  </div>
                }

                @if (selectedRequest.customerRemarks) {
                  <div class="mt-3 p-3 bg-light rounded">
                    <h6 class="text-muted mb-2">Your Remarks</h6>
                    <p class="mb-0">{{ selectedRequest.customerRemarks }}</p>
                  </div>
                }

                @if (selectedRequest.technicianRemarks) {
                  <div class="mt-3 p-3 bg-info-subtle rounded">
                    <h6 class="text-info mb-2"><i class="bi bi-chat-left-text me-1"></i>Technician Notes</h6>
                    <p class="mb-0">{{ selectedRequest.technicianRemarks }}</p>
                  </div>
                }
              </div>
              <div class="modal-footer border-0">
                @if (canModifyRequest(selectedRequest)) {
                  <button type="button" class="btn btn-outline-warning" (click)="closeDetailsModal(); openRescheduleModal(selectedRequest!)">
                    <i class="bi bi-calendar-event me-1"></i>Reschedule
                  </button>
                  <button type="button" class="btn btn-outline-danger" (click)="closeDetailsModal(); openCancelModal(selectedRequest!)">
                    <i class="bi bi-x-circle me-1"></i>Cancel Request
                  </button>
                }
                <button type="button" class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Service Modal -->
      @if (showCancelModal && requestToCancel) {
        <div class="modal-backdrop fade show" (click)="closeCancelModal()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
              <div class="modal-header border-0 bg-danger text-white">
                <h5 class="modal-title">
                  <i class="bi bi-exclamation-triangle me-2"></i>Cancel Service Request
                </h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeCancelModal()"></button>
              </div>
              <div class="modal-body p-4">
                <div class="alert alert-warning mb-3">
                  <i class="bi bi-info-circle me-2"></i>
                  Are you sure you want to cancel this service request?
                </div>
                <p class="mb-3">
                  <strong>Service:</strong> {{ getServiceNames(requestToCancel) }}<br>
                  <strong>Vehicle:</strong> {{ requestToCancel.vehicleInfo }}
                </p>
                <div class="mb-3">
                  <label class="form-label">Reason for cancellation <span class="text-danger">*</span></label>
                  <textarea class="form-control" [(ngModel)]="cancelReason" rows="3" 
                            placeholder="Please provide a reason for cancellation..."></textarea>
                </div>
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn btn-secondary" (click)="closeCancelModal()">
                  <i class="bi bi-arrow-left me-1"></i>Go Back
                </button>
                <button type="button" class="btn btn-danger" (click)="confirmCancel()" 
                        [disabled]="!cancelReason.trim() || cancelLoading">
                  @if (cancelLoading) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  <i class="bi bi-x-circle me-1"></i>Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Reschedule Service Modal -->
      @if (showRescheduleModal && requestToReschedule) {
        <div class="modal-backdrop fade show" (click)="closeRescheduleModal()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
              <div class="modal-header border-0 bg-warning text-dark">
                <h5 class="modal-title">
                  <i class="bi bi-calendar-event me-2"></i>Reschedule Service Request
                </h5>
                <button type="button" class="btn-close" (click)="closeRescheduleModal()"></button>
              </div>
              <div class="modal-body p-4">
                <p class="mb-3">
                  <strong>Service:</strong> {{ getServiceNames(requestToReschedule) }}<br>
                  <strong>Vehicle:</strong> {{ requestToReschedule.vehicleInfo }}<br>
                  <strong>Current Date:</strong> {{ requestToReschedule.scheduledDate | date:'mediumDate' }}
                </p>
                <div class="mb-3">
                  <label class="form-label">New Scheduled Date <span class="text-danger">*</span></label>
                  <input type="datetime-local" class="form-control" [(ngModel)]="newScheduledDate" 
                         [min]="minDate">
                </div>
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn btn-secondary" (click)="closeRescheduleModal()">
                  <i class="bi bi-x me-1"></i>Cancel
                </button>
                <button type="button" class="btn btn-warning" (click)="confirmReschedule()" 
                        [disabled]="!newScheduledDate || rescheduleLoading">
                  @if (rescheduleLoading) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  <i class="bi bi-check-lg me-1"></i>Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Success/Error Toast -->
      @if (toastMessage) {
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
          <div class="toast show" [ngClass]="toastType === 'success' ? 'bg-success' : 'bg-danger'">
            <div class="toast-body text-white d-flex align-items-center">
              <i class="bi me-2" [ngClass]="toastType === 'success' ? 'bi-check-circle' : 'bi-exclamation-circle'"></i>
              {{ toastMessage }}
              <button type="button" class="btn-close btn-close-white ms-auto" (click)="toastMessage = ''"></button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .service-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .service-card:hover {
      box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important;
    }
    .step {
      opacity: 0.4;
    }
    .step.active, .step.completed {
      opacity: 1;
    }
    .step.completed .step-icon {
      color: var(--bs-success);
    }
    .step.active .step-icon {
      color: var(--bs-primary);
    }
    .step-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .step.completed .step-icon {
      background: var(--bs-success-bg-subtle);
    }
    .step.active .step-icon {
      background: var(--bs-primary-bg-subtle);
    }
    .step-line {
      height: 2px;
      background: #e9ecef;
      align-self: center;
      margin-top: -20px;
    }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; }
    .modal { z-index: 1050; }
  `]
})
export class TrackServiceComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  requests: ServiceRequest[] = [];
  bills: BillSummary[] = [];
  loading = true;
  showDetailsModal = false;
  selectedRequest: ServiceRequest | null = null;
  showCancelModal = false;
  requestToCancel: ServiceRequest | null = null;
  cancelReason = '';
  cancelLoading = false;
  showRescheduleModal = false;
  requestToReschedule: ServiceRequest | null = null;
  newScheduledDate = '';
  rescheduleLoading = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  get activeRequests(): ServiceRequest[] {
    return this.requests.filter(r =>
      r.status !== 'Cancelled' &&
      r.status !== 'Closed' &&
      !r.hasBill
    );
  }

  get completedRequests(): ServiceRequest[] {
    return this.requests.filter(r => r.hasBill || r.status === 'Closed');
  }

  getBillForRequest(serviceRequestId: number): BillSummary | undefined {
    return this.bills.find(b => b.serviceRequestId === serviceRequestId);
  }

  getPaymentStatus(serviceRequestId: number): string {
    const bill = this.getBillForRequest(serviceRequestId);
    return bill?.paymentStatus || 'Pending';
  }

  getPaymentStatusClass(serviceRequestId: number): string {
    const status = this.getPaymentStatus(serviceRequestId);
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'PartiallyPaid': return 'bg-warning text-dark';
      default: return 'bg-danger';
    }
  }

  getBillAmount(serviceRequestId: number): number {
    const bill = this.getBillForRequest(serviceRequestId);
    return bill?.totalAmount || 0;
  }

  getBalanceDue(serviceRequestId: number): number {
    const bill = this.getBillForRequest(serviceRequestId);
    return bill?.balanceDue || 0;
  }

  payNow(request: ServiceRequest) {
    const bill = this.getBillForRequest(request.serviceRequestId);
    if (bill) {
      this.router.navigate(['/app/bills', bill.billId]);
    }
  }

  get minDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 16);
  }

  ngOnInit() {
    this.loadRequests();
    this.loadBills();
  }

  loadRequests() {
    this.loading = true;
    this.api.get<any>('/servicerequests').subscribe({
      next: res => {
        this.requests = res.success ? (res.data.items || res.data) : [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadBills() {
    this.api.get<BillSummary[]>('/bills').subscribe({
      next: res => {
        this.bills = res.success ? res.data : [];
      },
      error: () => { this.bills = []; }
    });
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Requested': return 'bg-secondary';
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
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
      case 'Requested': return 'Awaiting Assignment';
      case 'Assigned': return 'Technician Assigned';
      case 'InProgress': return 'Work In Progress';
      case 'Completed': return 'Service Completed';
      default: return status;
    }
  }

  getStatusDescription(status: string): string {
    switch (status) {
      case 'Requested': return 'Your request is being reviewed';
      case 'Assigned': return 'A technician will start soon';
      case 'InProgress': return 'Your vehicle is being serviced';
      case 'Completed': return 'Service has been completed';
      default: return '';
    }
  }

  getProgressBarClass(status: string): string {
    switch (status) {
      case 'Requested': return 'bg-secondary';
      case 'Assigned': return 'bg-primary';
      case 'InProgress': return 'bg-info progress-bar-striped progress-bar-animated';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getProgressWidth(status: string): number {
    switch (status) {
      case 'Requested': return 25;
      case 'Assigned': return 50;
      case 'InProgress': return 75;
      case 'Completed': return 100;
      default: return 0;
    }
  }

  isStepActive(status: string, step: number): boolean {
    const statusOrder = ['Requested', 'Assigned', 'InProgress', 'Completed'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex === step - 1;
  }

  isStepCompleted(status: string, step: number): boolean {
    const statusOrder = ['Requested', 'Assigned', 'InProgress', 'Completed'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= step;
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
  canModifyRequest(request: ServiceRequest): boolean {
    const nonModifiableStatuses = ['Completed', 'Cancelled', 'Closed', 'InProgress'];
    return !nonModifiableStatuses.includes(request.status);
  }
  openCancelModal(request: ServiceRequest) {
    this.requestToCancel = request;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.requestToCancel = null;
    this.cancelReason = '';
  }

  confirmCancel() {
    if (!this.requestToCancel || !this.cancelReason.trim()) return;

    this.cancelLoading = true;
    this.api.put<any>(`/servicerequests/${this.requestToCancel.serviceRequestId}/cancel`, {
      reason: this.cancelReason.trim()
    }).subscribe({
      next: (res) => {
        this.cancelLoading = false;
        if (res.success) {
          this.showToast('Service request cancelled successfully', 'success');
          this.closeCancelModal();
          this.loadRequests();
        } else {
          this.showToast(res.message || 'Failed to cancel service request', 'error');
        }
      },
      error: (err) => {
        this.cancelLoading = false;
        this.showToast(err.error?.message || 'Failed to cancel service request', 'error');
      }
    });
  }
  openRescheduleModal(request: ServiceRequest) {
    this.requestToReschedule = request;
    if (request.scheduledDate) {
      const date = new Date(request.scheduledDate);
      this.newScheduledDate = date.toISOString().slice(0, 16);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      this.newScheduledDate = tomorrow.toISOString().slice(0, 16);
    }
    this.showRescheduleModal = true;
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.requestToReschedule = null;
    this.newScheduledDate = '';
  }

  confirmReschedule() {
    if (!this.requestToReschedule || !this.newScheduledDate) return;

    this.rescheduleLoading = true;
    this.api.put<any>(`/servicerequests/${this.requestToReschedule.serviceRequestId}/reschedule`, {
      newDate: new Date(this.newScheduledDate).toISOString()
    }).subscribe({
      next: (res) => {
        this.rescheduleLoading = false;
        if (res.success) {
          this.showToast('Service request rescheduled successfully', 'success');
          this.closeRescheduleModal();
          this.loadRequests();
        } else {
          this.showToast(res.message || 'Failed to reschedule service request', 'error');
        }
      },
      error: (err) => {
        this.rescheduleLoading = false;
        this.showToast(err.error?.message || 'Failed to reschedule service request', 'error');
      }
    });
  }
  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => {
      this.toastMessage = '';
    }, 5000);
  }
}
