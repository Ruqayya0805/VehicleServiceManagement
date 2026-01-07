import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { Vehicle } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">{{ isCustomer ? 'My Vehicles' : 'All Vehicles' }}</h4>
        @if (isCustomer) {
          <button class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Add Vehicle</button>
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
                       placeholder="Search by customer, make, model, registration..." 
                       [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" (click)="searchTerm = ''; applyFilters()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            <div class="col-md-6 text-md-end">
              <span class="text-muted">{{ filteredVehicles.length }} of {{ vehicles.length }} vehicles</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && filteredVehicles.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-truck fs-1 text-muted"></i>
          <p class="text-muted mt-2">No vehicles found</p>
        </div>
      }

      @if (!loading && filteredVehicles.length > 0) {
        <!-- Table view for Service Manager/Admin -->
        @if (!isCustomer) {
          <div class="card border-0 shadow-sm">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="sortable" (click)="sort('vehicleId')">#
                      <i class="bi ms-1" [ngClass]="getSortIcon('vehicleId')"></i>
                    </th>
                    <th class="sortable" (click)="sort('customerName')">Customer
                      <i class="bi ms-1" [ngClass]="getSortIcon('customerName')"></i>
                    </th>
                    <th class="sortable" (click)="sort('make')">Make
                      <i class="bi ms-1" [ngClass]="getSortIcon('make')"></i>
                    </th>
                    <th class="sortable" (click)="sort('model')">Model
                      <i class="bi ms-1" [ngClass]="getSortIcon('model')"></i>
                    </th>
                    <th class="sortable" (click)="sort('year')">Year
                      <i class="bi ms-1" [ngClass]="getSortIcon('year')"></i>
                    </th>
                    <th class="sortable" (click)="sort('vehicleType')">Type
                      <i class="bi ms-1" [ngClass]="getSortIcon('vehicleType')"></i>
                    </th>
                    <th class="sortable" (click)="sort('color')">Color
                      <i class="bi ms-1" [ngClass]="getSortIcon('color')"></i>
                    </th>
                    <th class="sortable" (click)="sort('fuelType')">Fuel Type
                      <i class="bi ms-1" [ngClass]="getSortIcon('fuelType')"></i>
                    </th>
                    <th class="sortable" (click)="sort('registrationNumber')">Reg. Number
                      <i class="bi ms-1" [ngClass]="getSortIcon('registrationNumber')"></i>
                    </th>
                    <th>RC Number</th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of paginatedVehicles; track v.vehicleId) {
                    <tr>
                      <td>{{ v.vehicleId }}</td>
                      <td>{{ v.customerName }}</td>
                      <td>{{ v.make }}</td>
                      <td>{{ v.model }}</td>
                      <td>{{ v.year }}</td>
                      <td><span class="badge bg-secondary">{{ v.vehicleType }}</span></td>
                      <td>{{ v.color }}</td>
                      <td>{{ v.fuelType }}</td>
                      <td><strong>{{ v.registrationNumber }}</strong></td>
                      <td>{{ v.rcNumber || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <app-pagination
              [currentPage]="currentPage"
              [pageSize]="pageSize"
              [totalItems]="filteredVehicles.length"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)">
            </app-pagination>
          </div>
        } @else {
          <!-- Card view for Customers -->
          <div class="row g-3">
            @for (v of paginatedVehicles; track v.vehicleId) {
              <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body">
                    <div class="d-flex justify-content-between">
                      <div>
                        <h6 class="mb-1">{{ v.make }} {{ v.model }}</h6>
                        <p class="text-muted small mb-2">{{ v.year }} • {{ v.color }}</p>
                      </div>
                      <span class="badge bg-secondary h-fit">{{ v.vehicleType }}</span>
                    </div>
                    <p class="mb-1"><strong>Reg:</strong> {{ v.registrationNumber }}</p>
                    <p class="mb-1 small"><strong>Fuel:</strong> {{ v.fuelType }}</p>
                    <p class="mb-0 small text-muted">RC: {{ v.rcNumber || '-' }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalItems]="filteredVehicles.length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        }
      }
    </div>
  `,
  styles: [`
    .h-fit { height: fit-content; }
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0,0,0,0.05); }
  `]
})
export class VehiclesComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);

  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  loading = true;
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get isCustomer() { return this.authService.isCustomer(); }

  get paginatedVehicles(): Vehicle[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVehicles.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    const endpoint = this.isCustomer ? '/vehicles/my-vehicles' : '/vehicles';
    this.api.get<Vehicle[]>(endpoint).subscribe({
      next: res => {
        this.vehicles = res.success ? res.data : [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters() {
    let result = [...this.vehicles];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(v =>
        v.customerName?.toLowerCase().includes(term) ||
        v.make?.toLowerCase().includes(term) ||
        v.model?.toLowerCase().includes(term) ||
        v.registrationNumber?.toLowerCase().includes(term) ||
        v.vehicleType?.toLowerCase().includes(term) ||
        v.color?.toLowerCase().includes(term)
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

    this.filteredVehicles = result;
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

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }
}
