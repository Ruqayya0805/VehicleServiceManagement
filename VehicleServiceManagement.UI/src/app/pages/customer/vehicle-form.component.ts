import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Vehicle } from '../../core/models';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="vehicle-form-page">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/app/my-vehicles" class="text-decoration-none">My Vehicles</a></li>
          <li class="breadcrumb-item active">{{ isEditMode ? 'Edit Vehicle' : 'Add Vehicle' }}</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex align-items-center mb-4">
        <button class="btn btn-outline-secondary me-3" routerLink="/app/my-vehicles">
          <i class="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 class="mb-1">{{ isEditMode ? 'Edit Vehicle' : 'Add New Vehicle' }}</h4>
          <p class="text-muted mb-0">{{ isEditMode ? 'Update your vehicle details' : 'Register a new vehicle to your account' }}</p>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Loading vehicle details...</p>
        </div>
      }

      <!-- Form -->
      @if (!loading) {
        <div class="card border-0 shadow-sm">
          <div class="card-body p-4">
            @if (formError) {
              <div class="alert alert-danger d-flex align-items-center mb-4">
                <i class="bi bi-exclamation-triangle me-2"></i>{{ formError }}
              </div>
            }

            <form [formGroup]="vehicleForm" (ngSubmit)="submitForm()">
              <!-- Vehicle Basic Info Section -->
              <div class="mb-4">
                <h6 class="text-primary mb-3"><i class="bi bi-car-front me-2"></i>Vehicle Information</h6>
                <div class="row g-3">
                  <!-- Registration Number -->
                  <div class="col-md-6">
                    <label class="form-label fw-medium">Registration Number <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-lg" formControlName="registrationNumber"
                           placeholder="e.g., MH-12-AB-1234" [class.is-invalid]="isFieldInvalid('registrationNumber')"
                           [readonly]="isEditMode">
                    @if (isFieldInvalid('registrationNumber')) {
                      <div class="invalid-feedback">Registration number is required</div>
                    }
                    @if (isEditMode) {
                      <small class="text-muted">Registration number cannot be changed</small>
                    }
                  </div>

                  <!-- Vehicle Type -->
                  <div class="col-md-6">
                    <label class="form-label fw-medium">Vehicle Type <span class="text-danger">*</span></label>
                    <select class="form-select form-select-lg" formControlName="vehicleType"
                            [class.is-invalid]="isFieldInvalid('vehicleType')">
                      <option value="">Select Vehicle Type</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Other">Other</option>
                    </select>
                    @if (isFieldInvalid('vehicleType')) {
                      <div class="invalid-feedback">Please select a vehicle type</div>
                    }
                  </div>

                  <!-- Make -->
                  <div class="col-md-6">
                    <label class="form-label fw-medium">Make <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-lg" formControlName="make"
                           placeholder="e.g., Toyota, Honda, Maruti" [class.is-invalid]="isFieldInvalid('make')">
                    @if (isFieldInvalid('make')) {
                      <div class="invalid-feedback">Make is required</div>
                    }
                  </div>

                  <!-- Model -->
                  <div class="col-md-6">
                    <label class="form-label fw-medium">Model <span class="text-danger">*</span></label>
                    <input type="text" class="form-control form-control-lg" formControlName="model"
                           placeholder="e.g., Camry, Civic, Swift" [class.is-invalid]="isFieldInvalid('model')">
                    @if (isFieldInvalid('model')) {
                      <div class="invalid-feedback">Model is required</div>
                    }
                  </div>
                </div>
              </div>

              <!-- Vehicle Details Section -->
              <div class="mb-4">
                <h6 class="text-primary mb-3"><i class="bi bi-info-circle me-2"></i>Additional Details</h6>
                <div class="row g-3">
                  <!-- Year -->
                  <div class="col-md-4">
                    <label class="form-label fw-medium">Year <span class="text-danger">*</span></label>
                    <input type="number" class="form-control form-control-lg" formControlName="year"
                           placeholder="e.g., 2022" [class.is-invalid]="isFieldInvalid('year')">
                    @if (isFieldInvalid('year')) {
                      <div class="invalid-feedback">Please enter a valid year (1900-2100)</div>
                    }
                  </div>

                  <!-- Fuel Type -->
                  <div class="col-md-4">
                    <label class="form-label fw-medium">Fuel Type <span class="text-danger">*</span></label>
                    <select class="form-select form-select-lg" formControlName="fuelType"
                            [class.is-invalid]="isFieldInvalid('fuelType')">
                      <option value="">Select Fuel Type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="CNG">CNG</option>
                      <option value="EV">Electric (EV)</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    @if (isFieldInvalid('fuelType')) {
                      <div class="invalid-feedback">Please select a fuel type</div>
                    }
                  </div>

                  <!-- Color -->
                  <div class="col-md-4">
                    <label class="form-label fw-medium">Color</label>
                    <input type="text" class="form-control form-control-lg" formControlName="color"
                           placeholder="e.g., White, Black, Silver">
                  </div>

                  <!-- RC Number -->
                  <div class="col-md-6">
                    <label class="form-label fw-medium">RC Number</label>
                    <input type="text" class="form-control form-control-lg" formControlName="rcNumber"
                           placeholder="e.g., RC-2022-123456">
                    <small class="text-muted">Registration Certificate number (optional)</small>
                  </div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="d-flex justify-content-end gap-3 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary btn-lg px-4" routerLink="/app/my-vehicles">
                  <i class="bi bi-x-lg me-2"></i>Cancel
                </button>
                <button type="submit" class="btn btn-primary btn-lg px-4" [disabled]="saving || vehicleForm.invalid">
                  @if (saving) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    {{ isEditMode ? 'Updating...' : 'Adding...' }}
                  } @else {
                    <i class="bi me-2" [ngClass]="isEditMode ? 'bi-check-lg' : 'bi-plus-lg'"></i>
                    {{ isEditMode ? 'Update Vehicle' : 'Add Vehicle' }}
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vehicle-form-page {
      width: 100%;
    }
  `]
})
export class VehicleFormComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  saving = false;
  formError = '';
  isEditMode = false;
  vehicleId: number | null = null;

  vehicleForm: FormGroup = this.fb.group({
    registrationNumber: ['', [Validators.required, Validators.maxLength(20)]],
    make: ['', [Validators.required, Validators.maxLength(50)]],
    model: ['', [Validators.required, Validators.maxLength(50)]],
    year: ['', [Validators.required, Validators.min(1900), Validators.max(2100)]],
    vehicleType: ['', Validators.required],
    fuelType: ['', Validators.required],
    color: ['', Validators.maxLength(30)],
    rcNumber: ['', Validators.maxLength(50)]
  });

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.vehicleId = parseInt(idParam, 10);
      this.loadVehicle();
    }
  }

  loadVehicle() {
    if (!this.vehicleId) return;

    this.loading = true;
    this.api.get<Vehicle>(`/vehicles/${this.vehicleId}`).subscribe({
      next: res => {
        if (res.success && res.data) {
          const vehicle = res.data;
          this.vehicleForm.patchValue({
            registrationNumber: vehicle.registrationNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vehicleType: vehicle.vehicleType,
            fuelType: vehicle.fuelType,
            color: vehicle.color,
            rcNumber: vehicle.rcNumber
          });
        }
        this.loading = false;
      },
      error: () => {
        this.formError = 'Failed to load vehicle details';
        this.loading = false;
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.vehicleForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  submitForm() {
    if (this.vehicleForm.invalid) {
      Object.keys(this.vehicleForm.controls).forEach(key => {
        this.vehicleForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    this.formError = '';
    const formData = this.vehicleForm.value;

    if (this.isEditMode && this.vehicleId) {
      this.api.put<Vehicle>(`/vehicles/${this.vehicleId}`, {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vehicleType: formData.vehicleType,
        fuelType: formData.fuelType,
        color: formData.color,
        rcNumber: formData.rcNumber
      }).subscribe({
        next: res => {
          if (res.success) {
            this.router.navigate(['/app/my-vehicles']);
          } else {
            this.formError = res.message || 'Failed to update vehicle';
          }
          this.saving = false;
        },
        error: (err: any) => {
          this.formError = err.error?.message || 'Failed to update vehicle';
          this.saving = false;
        }
      });
    } else {
      this.api.post<Vehicle>('/vehicles', formData).subscribe({
        next: res => {
          if (res.success) {
            this.router.navigate(['/app/my-vehicles']);
          } else {
            this.formError = res.message || 'Failed to add vehicle';
          }
          this.saving = false;
        },
        error: (err: any) => {
          this.formError = err.error?.message || 'Failed to add vehicle';
          this.saving = false;
        }
      });
    }
  }
}
