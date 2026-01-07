import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Vehicle, ServiceCategory } from '../../core/models';

@Component({
  selector: 'app-book-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="book-service">
      <!-- Header -->
      <div class="mb-4">
        <h4 class="mb-1">Book a Service</h4>
        <p class="text-muted mb-0">Schedule a service appointment for your vehicle</p>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
          <p class="text-muted mt-3">Loading...</p>
        </div>
      }

      <!-- No Vehicles State -->
      @if (!loading && vehicles.length === 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <div class="mb-4">
              <i class="bi bi-car-front text-warning" style="font-size: 4rem; opacity: 0.7;"></i>
            </div>
            <h5>No Vehicles Registered</h5>
            <p class="text-muted mb-4">You need to add a vehicle before booking a service</p>
            <button class="btn btn-primary" (click)="goToVehicles()">
              <i class="bi bi-plus-lg me-2"></i>Add a Vehicle First
            </button>
          </div>
        </div>
      }

      <!-- Booking Form -->
      @if (!loading && vehicles.length > 0) {
        <div class="row">
          <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-primary text-white border-0 py-3">
                <h5 class="mb-0"><i class="bi bi-calendar-plus me-2"></i>Service Request Form</h5>
              </div>
              <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()">
                <div class="card-body p-4">
                  @if (formError) {
                    <div class="alert alert-danger d-flex align-items-center">
                      <i class="bi bi-exclamation-triangle me-2"></i>{{ formError }}
                    </div>
                  }
                  @if (formSuccess) {
                    <div class="alert alert-success d-flex align-items-center">
                      <i class="bi bi-check-circle me-2"></i>{{ formSuccess }}
                    </div>
                  }

                  <!-- Step 1: Select Vehicle -->
                  <div class="form-section mb-4">
                    <h6 class="text-primary mb-3"><span class="badge bg-primary me-2">1</span>Select Your Vehicle</h6>
                    <div class="row g-3">
                      @for (vehicle of vehicles; track vehicle.vehicleId) {
                        <div class="col-md-6">
                          <div class="form-check vehicle-option p-3 border rounded" 
                               [class.border-primary]="bookingForm.get('vehicleId')?.value === vehicle.vehicleId"
                               [class.bg-primary-subtle]="bookingForm.get('vehicleId')?.value === vehicle.vehicleId">
                            <input class="form-check-input" type="radio" [value]="vehicle.vehicleId"
                                   formControlName="vehicleId" [id]="'vehicle-' + vehicle.vehicleId">
                            <label class="form-check-label w-100 cursor-pointer" [for]="'vehicle-' + vehicle.vehicleId">
                              <strong>{{ vehicle.make }} {{ vehicle.model }}</strong>
                              <span class="badge bg-secondary ms-2">{{ vehicle.year }}</span>
                              <div class="small text-muted mt-1">{{ vehicle.registrationNumber }}</div>
                            </label>
                          </div>
                        </div>
                      }
                    </div>
                    @if (isFieldInvalid('vehicleId')) {
                      <div class="text-danger small mt-2"><i class="bi bi-exclamation-circle me-1"></i>Please select a vehicle</div>
                    }
                  </div>

                  <!-- Step 2: Select Service Categories (Multiple) -->
                  <div class="form-section mb-4">
                    <h6 class="text-primary mb-3">
                      <span class="badge bg-primary me-2">2</span>Select Services 
                      <span class="badge bg-info ms-2">Select Multiple</span>
                    </h6>
                    <div class="row g-3">
                      @for (category of categories; track category.categoryId) {
                        <div class="col-md-6">
                          <div class="form-check service-option p-3 border rounded" 
                               [class.border-success]="isServiceSelected(category.categoryId)"
                               [class.bg-success-subtle]="isServiceSelected(category.categoryId)">
                            <input class="form-check-input" type="checkbox" 
                                   [checked]="isServiceSelected(category.categoryId)"
                                   (change)="toggleService(category.categoryId)"
                                   [id]="'category-' + category.categoryId">
                            <label class="form-check-label w-100 cursor-pointer" [for]="'category-' + category.categoryId">
                              <div class="d-flex justify-content-between align-items-start">
                                <strong>{{ category.categoryName }}</strong>
                                <span class="text-primary fw-bold">₹{{ category.basePrice | number }}</span>
                              </div>
                              <div class="small text-muted mt-1">{{ category.description }}</div>
                              <div class="small mt-1">
                                <i class="bi bi-clock me-1"></i>~{{ category.estimatedDurationMinutes }} mins
                              </div>
                            </label>
                          </div>
                        </div>
                      }
                    </div>
                    @if (selectedCategoryIds.length === 0) {
                      <div class="text-info small mt-2"><i class="bi bi-info-circle me-1"></i>No service selected? Describe your issue below and our team will assist you.</div>
                    }
                  </div>

                  <!-- Step 3: Issue Description -->
                  <div class="form-section mb-4">
                    <h6 class="text-primary mb-3"><span class="badge bg-primary me-2">3</span>Describe the Issue</h6>
                    <textarea class="form-control form-control-lg" formControlName="issueDescription" rows="4"
                              placeholder="Please describe the issue with your vehicle in detail..."
                              [class.is-invalid]="isFieldInvalid('issueDescription')"></textarea>
                    @if (isFieldInvalid('issueDescription')) {
                      <div class="invalid-feedback">Please describe the issue (minimum 10 characters)</div>
                    }
                  </div>

                  <!-- Step 4: Schedule & Priority -->
                  <div class="form-section mb-4">
                    <h6 class="text-primary mb-3"><span class="badge bg-primary me-2">4</span>Schedule & Priority</h6>
                    <div class="row g-3">
                      <div class="col-md-6">
                        <label class="form-label fw-medium">Preferred Date <span class="text-danger">*</span></label>
                        <input type="date" class="form-control form-control-lg" formControlName="scheduledDate"
                               [min]="minDate" [class.is-invalid]="isFieldInvalid('scheduledDate')">
                        @if (isFieldInvalid('scheduledDate')) {
                          <div class="invalid-feedback">Please select a scheduled date</div>
                        }
                      </div>
                      <div class="col-md-6">
                        <label class="form-label fw-medium">Priority</label>
                        <div class="d-flex gap-3 mt-2">
                          <div class="form-check">
                            <input class="form-check-input" type="radio" value="Normal" formControlName="priority" id="priorityNormal">
                            <label class="form-check-label" for="priorityNormal">
                              <span class="badge bg-secondary">Normal</span>
                            </label>
                          </div>
                          <div class="form-check">
                            <input class="form-check-input" type="radio" value="Urgent" formControlName="priority" id="priorityUrgent">
                            <label class="form-check-label" for="priorityUrgent">
                              <span class="badge bg-danger">Urgent</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card-footer bg-light border-0 p-4">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      @if (selectedCategoryIds.length > 0) {
                        <span class="text-muted">Total Estimated Cost:</span>
                        <span class="h4 text-primary ms-2 mb-0">₹{{ totalEstimatedCost | number }}</span>
                        <span class="badge bg-info ms-2">{{ selectedCategoryIds.length }} service(s)</span>
                      }
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg px-5" [disabled]="submitting || bookingForm.invalid || bookingComplete">
                      @if (submitting) {
                        <span class="spinner-border spinner-border-sm me-2"></span>
                      }
                      <i class="bi bi-check-lg me-2"></i>Book Service
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Summary Sidebar -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm sticky-top" style="top: 20px;">
              <div class="card-header bg-light border-0 py-3">
                <h6 class="mb-0"><i class="bi bi-receipt me-2"></i>Booking Summary</h6>
              </div>
              <div class="card-body">
                @if (selectedVehicle) {
                  <div class="mb-3 pb-3 border-bottom">
                    <small class="text-muted d-block mb-1">Vehicle</small>
                    <strong>{{ selectedVehicle.make }} {{ selectedVehicle.model }}</strong>
                    <div class="small text-muted">{{ selectedVehicle.registrationNumber }}</div>
                  </div>
                } @else {
                  <div class="mb-3 pb-3 border-bottom text-muted">
                    <small class="d-block mb-1">Vehicle</small>
                    <span>Not selected</span>
                  </div>
                }

                @if (selectedCategoryIds.length > 0) {
                  <div class="mb-3 pb-3 border-bottom">
                    <small class="text-muted d-block mb-1">Selected Services ({{ selectedCategoryIds.length }})</small>
                    @for (cat of selectedCategories; track cat.categoryId) {
                      <div class="d-flex justify-content-between align-items-center py-1">
                        <span>{{ cat.categoryName }}</span>
                        <span class="text-primary">₹{{ cat.basePrice | number }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="mb-3 pb-3 border-bottom text-muted">
                    <small class="d-block mb-1">Services</small>
                    <span>Not selected</span>
                  </div>
                }

                @if (bookingForm.get('scheduledDate')?.value) {
                  <div class="mb-3 pb-3 border-bottom">
                    <small class="text-muted d-block mb-1">Scheduled Date</small>
                    <strong>{{ bookingForm.get('scheduledDate')?.value | date:'mediumDate' }}</strong>
                  </div>
                } @else {
                  <div class="mb-3 pb-3 border-bottom text-muted">
                    <small class="d-block mb-1">Scheduled Date</small>
                    <span>Not selected</span>
                  </div>
                }

                <div class="mb-3">
                  <small class="text-muted d-block mb-1">Priority</small>
                  <span class="badge" [ngClass]="bookingForm.get('priority')?.value === 'Urgent' ? 'bg-danger' : 'bg-secondary'">
                    {{ bookingForm.get('priority')?.value || 'Normal' }}
                  </span>
                </div>

                @if (selectedCategoryIds.length > 0) {
                  <div class="bg-primary-subtle p-3 rounded mt-3">
                    @if (bookingForm.get('priority')?.value === 'Urgent') {
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Base Cost</span>
                        <span>₹{{ baseCost | number }}</span>
                      </div>
                      <div class="d-flex justify-content-between align-items-center mb-2 text-danger">
                        <span>Urgent Surcharge (50%)</span>
                        <span>₹{{ urgentSurcharge | number }}</span>
                      </div>
                      <hr class="my-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <strong>Total Estimated Cost</strong>
                        <span class="h5 text-primary mb-0">₹{{ totalEstimatedCost | number }}</span>
                      </div>
                    } @else {
                      <div class="d-flex justify-content-between align-items-center">
                        <span>Total Estimated Cost</span>
                        <span class="h5 text-primary mb-0">₹{{ totalEstimatedCost | number }}</span>
                      </div>
                    }
                    <small class="text-muted d-block mt-2">Final cost may vary based on actual work</small>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vehicle-option, .service-option {
      cursor: pointer;
      transition: all 0.2s;
    }
    .vehicle-option:hover, .service-option:hover {
      border-color: var(--bs-primary) !important;
      background: rgba(13, 110, 253, 0.05);
    }
    .cursor-pointer { cursor: pointer; }
    .form-check-input:checked + label {
      color: var(--bs-primary);
    }
  `]
})
export class BookServiceComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  vehicles: Vehicle[] = [];
  categories: ServiceCategory[] = [];
  selectedCategoryIds: number[] = [];
  loading = true;
  submitting = false;
  formError = '';
  formSuccess = '';
  formSubmitted = false;
  bookingComplete = false;
  minDate = new Date().toISOString().split('T')[0];

  bookingForm: FormGroup = this.fb.group({
    vehicleId: [null, Validators.required],
    issueDescription: ['', [Validators.required, Validators.minLength(10)]],
    scheduledDate: ['', Validators.required],
    priority: ['Normal', Validators.required],
    customerRemarks: ['']
  });

  get selectedVehicle(): Vehicle | null {
    const id = this.bookingForm.get('vehicleId')?.value;
    return this.vehicles.find(v => v.vehicleId === id) || null;
  }

  get selectedCategories(): ServiceCategory[] {
    return this.categories.filter(c => this.selectedCategoryIds.includes(c.categoryId));
  }

  get baseCost(): number {
    return this.selectedCategories.reduce((sum, c) => sum + c.basePrice, 0);
  }

  get urgentSurcharge(): number {
    return this.baseCost * 0.5;
  }

  get totalEstimatedCost(): number {
    const priority = this.bookingForm.get('priority')?.value;
    return priority === 'Urgent' ? this.baseCost * 1.5 : this.baseCost;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.get<Vehicle[]>('/vehicles/my-vehicles').subscribe({
      next: res => {
        this.vehicles = res.success ? res.data : [];
        this.api.get<ServiceCategory[]>('/servicecategories').subscribe({
          next: catRes => {
            this.categories = catRes.success ? catRes.data.filter((c: ServiceCategory) => c.isActive) : [];
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.bookingForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isServiceSelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  toggleService(categoryId: number): void {
    const index = this.selectedCategoryIds.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategoryIds.splice(index, 1);
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
  }

  goToVehicles() {
    this.router.navigate(['/app/my-vehicles']);
  }

  submitBooking() {
    this.formSubmitted = true;

    if (this.bookingForm.invalid || this.bookingComplete) {
      Object.keys(this.bookingForm.controls).forEach(key => {
        this.bookingForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.formError = '';
    this.formSuccess = '';

    const formData = this.bookingForm.value;

    this.api.post<any>('/servicerequests', {
      vehicleId: formData.vehicleId,
      categoryIds: this.selectedCategoryIds,
      issueDescription: formData.issueDescription,
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      customerRemarks: formData.customerRemarks
    }).subscribe({
      next: res => {
        if (res.success) {
          this.bookingComplete = true;
          const serviceCount = this.selectedCategoryIds.length;
          this.formSuccess = serviceCount > 0
            ? `${serviceCount} service request(s) submitted successfully! Redirecting...`
            : 'Service request submitted successfully! Our team will review your issue. Redirecting...';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/app/track-service']);
          }, 2000);
        } else {
          this.formError = res.message || 'Failed to submit service request';
        }
        this.submitting = false;
      },
      error: (err: any) => {
        this.formError = err.error?.message || 'Failed to submit service request';
        this.submitting = false;
      }
    });
  }
}
