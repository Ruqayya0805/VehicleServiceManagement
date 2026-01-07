import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { BillSummary } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div>
      <h4 class="mb-4">{{ isCustomer ? 'My Bills & Payments' : 'All Bills' }}</h4>

      <!-- Search and Filter Bar -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-5">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control border-start-0" 
                       placeholder="Search by bill #, customer, vehicle..." 
                       [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" (click)="searchTerm = ''; applyFilters()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <div class="col-md-4 text-md-end">
              <span class="text-muted">{{ filteredBills.length }} of {{ bills.length }} bills</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && filteredBills.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-receipt fs-1 text-muted"></i>
          <p class="text-muted mt-2">No bills found</p>
        </div>
      }

      @if (!loading && filteredBills.length > 0) {
        <div class="row g-4">
          @for (b of paginatedBills; track b.billId) {
            <div class="col-12">
              <div class="card border-0 shadow-sm" [class.border-start]="true" [class.border-4]="true"
                [class.border-success]="b.paymentStatus === 'Paid'"
                [class.border-warning]="b.paymentStatus === 'PartiallyPaid'"
                [class.border-secondary]="b.paymentStatus === 'Pending'"
                style="cursor: pointer;" (click)="viewBill(b)">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-2">
                      <small class="text-muted d-block">Bill Number</small>
                      <strong>{{ b.billNumber || 'BILL-' + b.billId }}</strong>
                    </div>
                    <div class="col-md-2">
                      <small class="text-muted d-block">Service Request</small>
                      <strong>SR #{{ b.serviceRequestId }}</strong>
                    </div>
                    @if (!isCustomer) {
                      <div class="col-md-2">
                        <small class="text-muted d-block">Customer</small>
                        <strong>{{ b.customerName }}</strong>
                      </div>
                    }
                    <div class="col-md-2">
                      <small class="text-muted d-block">Vehicle</small>
                      <span>{{ b.vehicleInfo }}</span>
                    </div>
                    <div class="col-md-2">
                      <small class="text-muted d-block">Total Amount</small>
                      <strong class="text-primary fs-5">₹{{ b.totalAmount | number:'1.0-0' }}</strong>
                    </div>
                    <div class="col-md-2 text-end">
                      <span class="badge mb-2" [ngClass]="getStatusClass(b.paymentStatus)">{{ b.paymentStatus }}</span>
                      @if (b.isClosed) {
                        <span class="badge bg-dark ms-1">Closed</span>
                      }
                      <div class="mt-2">
                        @if (b.balanceDue > 0) {
                          <small class="text-danger d-block">
                            Balance: ₹{{ b.balanceDue | number:'1.0-0' }}
                          </small>
                        } @else {
                          <small class="text-success d-block">
                            <i class="bi bi-check-circle me-1"></i>Fully Paid
                          </small>
                        }
                      </div>
                    </div>
                  </div>
                  <div class="row mt-2 pt-2 border-top">
                    <div class="col-md-6">
                      <small class="text-muted">
                        <i class="bi bi-calendar me-1"></i>Generated: {{ b.generatedDate | date:'mediumDate' }}
                      </small>
                    </div>
                    <div class="col-md-6 text-end">
                      <small class="text-muted">
                        Due: {{ b.dueDate | date:'mediumDate' }}
                      </small>
                      <button class="btn btn-sm btn-outline-primary ms-3" (click)="viewBill(b); $event.stopPropagation()">
                        <i class="bi bi-eye me-1"></i>View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        <app-pagination
          [currentPage]="currentPage"
          [pageSize]="pageSize"
          [totalItems]="filteredBills.length"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      }
    </div>
  `
})
export class BillsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  bills: BillSummary[] = [];
  filteredBills: BillSummary[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;

  get isCustomer() { return this.authService.isCustomer(); }

  get paginatedBills(): BillSummary[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredBills.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.loadBills();
  }

  loadBills() {
    this.loading = true;
    this.api.get<BillSummary[]>('/bills').subscribe({
      next: (res) => {
        this.bills = res.success ? res.data : [];
        this.applyFilters();
        this.loading = false;
      },
      error: (_err) => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.bills];
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(b =>
        b.billNumber?.toLowerCase().includes(term) ||
        b.customerName?.toLowerCase().includes(term) ||
        b.vehicleInfo?.toLowerCase().includes(term) ||
        String(b.serviceRequestId).includes(term)
      );
    }
    if (this.statusFilter) {
      result = result.filter(b => b.paymentStatus === this.statusFilter);
    }

    this.filteredBills = result;
    this.currentPage = 1;
  }

  viewBill(bill: BillSummary) {
    this.router.navigate(['/app/bills', bill.billId]);
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
      case 'Paid': return 'bg-success';
      case 'PartiallyPaid': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }
}
