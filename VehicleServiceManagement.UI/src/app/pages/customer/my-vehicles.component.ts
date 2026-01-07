import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Vehicle } from '../../core/models';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="my-vehicles">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 class="mb-1">My Vehicles</h4>
          <p class="text-muted mb-0">Manage your registered vehicles</p>
        </div>
        <a routerLink="/app/my-vehicles/add" class="btn btn-primary btn-lg shadow-sm">
          <i class="bi bi-plus-lg me-2"></i>Add New Vehicle
        </a>
      </div>

      <!-- Loading State -->
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
          <p class="text-muted mt-3">Loading your vehicles...</p>
        </div>
      }

      <!-- Empty State -->
      @if (!loading && vehicles.length === 0) {
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5">
            <div class="empty-state-icon mb-4">
              <i class="bi bi-car-front text-primary" style="font-size: 4rem; opacity: 0.5;"></i>
            </div>
            <h5 class="text-muted">No Vehicles Registered</h5>
            <p class="text-muted mb-4">Add your first vehicle to start booking services</p>
            <a routerLink="/app/my-vehicles/add" class="btn btn-primary">
              <i class="bi bi-plus-lg me-2"></i>Add Your First Vehicle
            </a>
          </div>
        </div>
      }

      <!-- Vehicle Cards -->
      @if (!loading && vehicles.length > 0) {
        <div class="row g-4">
          @for (vehicle of vehicles; track vehicle.vehicleId) {
            <div class="col-lg-4 col-md-6">
              <div class="card vehicle-card border-0 shadow-sm h-100">
                <div class="card-header bg-gradient-primary text-white border-0 py-3">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="mb-1 fw-bold">{{ vehicle.make }} {{ vehicle.model }}</h5>
                      <span class="badge bg-white text-primary">{{ vehicle.year }}</span>
                    </div>
                    <span class="badge bg-light text-dark">{{ vehicle.vehicleType }}</span>
                  </div>
                </div>
                <div class="card-body">
                  <div class="vehicle-details">
                    <div class="detail-item mb-3">
                      <div class="d-flex align-items-center">
                        <div class="detail-icon bg-primary-subtle rounded-circle p-2 me-3">
                          <i class="bi bi-card-text text-primary"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">Registration Number</small>
                          <strong>{{ vehicle.registrationNumber }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="detail-item mb-3">
                      <div class="d-flex align-items-center">
                        <div class="detail-icon bg-info-subtle rounded-circle p-2 me-3">
                          <i class="bi bi-palette text-info"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">Color</small>
                          <strong>{{ vehicle.color || 'Not specified' }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="detail-item mb-3">
                      <div class="d-flex align-items-center">
                        <div class="detail-icon bg-warning-subtle rounded-circle p-2 me-3">
                          <i class="bi bi-fuel-pump text-warning"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">Fuel Type</small>
                          <strong>{{ vehicle.fuelType || 'Not specified' }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="detail-item">
                      <div class="d-flex align-items-center">
                        <div class="detail-icon bg-success-subtle rounded-circle p-2 me-3">
                          <i class="bi bi-file-earmark-text text-success"></i>
                        </div>
                        <div>
                          <small class="text-muted d-block">RC Number</small>
                          <strong>{{ vehicle.rcNumber || 'Not specified' }}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-footer bg-transparent border-0 pt-0">
                  <div class="d-flex gap-2">
                    <a [routerLink]="['/app/my-vehicles/edit', vehicle.vehicleId]" class="btn btn-sm btn-outline-primary flex-fill">
                      <i class="bi bi-pencil me-1"></i>Edit
                    </a>
                    <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(vehicle)" title="Delete">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal && vehicleToDelete) {
        <div class="modal-backdrop fade show" (click)="closeDeleteModal()"></div>
        <div class="modal d-block" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
              <div class="modal-header bg-danger text-white border-0">
                <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Delete Vehicle</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeDeleteModal()"></button>
              </div>
              <div class="modal-body p-4">
                <p>Are you sure you want to delete this vehicle?</p>
                <div class="bg-light p-3 rounded">
                  <strong>{{ vehicleToDelete.make }} {{ vehicleToDelete.model }}</strong> ({{ vehicleToDelete.year }})<br>
                  <span class="text-muted">{{ vehicleToDelete.registrationNumber }}</span>
                </div>
                <p class="text-danger mt-3 mb-0"><small><i class="bi bi-info-circle me-1"></i>This action cannot be undone.</small></p>
              </div>
              <div class="modal-footer border-0">
                <button type="button" class="btn btn-outline-secondary" (click)="closeDeleteModal()">Cancel</button>
                <button type="button" class="btn btn-danger" (click)="deleteVehicle()" [disabled]="deleting">
                  @if (deleting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                  }
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .vehicle-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .vehicle-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
    }
    .bg-gradient-primary {
      background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
    }
    .detail-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1040; }
    .modal { z-index: 1050; }
  `]
})
export class MyVehiclesComponent implements OnInit {
  private api = inject(ApiService);

  vehicles: Vehicle[] = [];
  loading = true;
  deleting = false;
  showDeleteModal = false;
  vehicleToDelete: Vehicle | null = null;

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.loading = true;
    this.api.get<Vehicle[]>('/vehicles/my-vehicles').subscribe({
      next: res => { this.vehicles = res.success ? res.data : []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  confirmDelete(vehicle: Vehicle) {
    this.vehicleToDelete = vehicle;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.vehicleToDelete = null;
  }

  deleteVehicle() {
    if (!this.vehicleToDelete) return;

    this.deleting = true;
    this.api.delete<boolean>(`/vehicles/${this.vehicleToDelete.vehicleId}`).subscribe({
      next: res => {
        if (res.success) {
          this.loadVehicles();
          this.closeDeleteModal();
        }
        this.deleting = false;
      },
      error: () => this.deleting = false
    });
  }
}
