import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Part, LowStockPart } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-parts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Parts Inventory</h4>
      </div>

      <!-- Search and Filter Bar -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="row g-3 align-items-center">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Search by name, part number, or supplier..." 
                  [(ngModel)]="searchTerm"
                  (ngModelChange)="applyFilters()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" type="button" (click)="searchTerm = ''; applyFilters()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            <div class="col-md-6 text-md-end">
              <button 
                class="btn" 
                [class.btn-warning]="showLowStock" 
                [class.btn-outline-warning]="!showLowStock"
                (click)="showLowStock = !showLowStock; applyFilters()">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ showLowStock ? 'Showing Low Stock' : 'Low Stock Only' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && filteredParts.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-box-seam display-1 text-muted"></i>
          <p class="text-muted mt-3">No parts found</p>
        </div>
      }

      @if (!loading && filteredParts.length > 0) {
        <div class="card border-0 shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="sortable" (click)="sort('partNumber')">Part #
                    <i class="bi ms-1" [ngClass]="getSortIcon('partNumber')"></i>
                  </th>
                  <th class="sortable" (click)="sort('partName')">Name
                    <i class="bi ms-1" [ngClass]="getSortIcon('partName')"></i>
                  </th>
                  <th class="sortable" (click)="sort('unitPrice')">Unit Price
                    <i class="bi ms-1" [ngClass]="getSortIcon('unitPrice')"></i>
                  </th>
                  <th class="sortable" (click)="sort('quantityInStock')">In Stock
                    <i class="bi ms-1" [ngClass]="getSortIcon('quantityInStock')"></i>
                  </th>
                  <th class="sortable" (click)="sort('reorderLevel')">Reorder Level
                    <i class="bi ms-1" [ngClass]="getSortIcon('reorderLevel')"></i>
                  </th>
                  <th class="sortable" (click)="sort('supplier')">Supplier
                    <i class="bi ms-1" [ngClass]="getSortIcon('supplier')"></i>
                  </th>
                  @if (canManage) {
                    <th class="text-end">Actions</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (p of paginatedParts; track p.partId) {
                  <tr [class.table-warning]="isLowStock(p)">
                    <td><code>{{ p.partNumber }}</code></td>
                    <td>{{ p.partName }}</td>
                    <td>₹{{ getPrice(p) | number:'1.2-2' }}</td>
                    <td [class.text-danger]="isLowStock(p)" [class.fw-bold]="isLowStock(p)">{{ p.quantityInStock }}</td>
                    <td>{{ p.reorderLevel }}</td>
                    <td>{{ p.supplier }}</td>
                    @if (canManage) {
                      <td class="text-end">
                        @if (isLowStock(p)) {
                          <button class="btn btn-sm btn-warning me-1" title="Order Now" (click)="orderPart(p)">
                            <i class="bi bi-cart-plus me-1"></i>Order Now
                          </button>
                        }
                        <a [routerLink]="['/app/parts/edit', p.partId]" class="btn btn-sm btn-outline-primary me-1">
                          <i class="bi bi-pencil"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-danger" (click)="deletePart(p)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalItems]="filteredParts.length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
        <div class="text-muted mt-2">
          <small>Showing {{ filteredParts.length }} of {{ parts.length }} parts</small>
        </div>
      }
    </div>
  `,
  styles: [`
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0,0,0,0.05); }
  `]
})
export class PartsComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  parts: Part[] = [];
  filteredParts: Part[] = [];
  loading = true;
  showLowStock = false;
  searchTerm = '';
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get canManage(): boolean {
    const role = this.auth.currentUser?.role;
    return role === 'Admin' || role === 'ServiceManager';
  }

  ngOnInit() {
    this.loadParts();
  }

  loadParts() {
    this.loading = true;
    this.api.get<Part[]>('/parts').subscribe({
      next: res => {
        this.parts = res.success ? res.data : [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters() {
    let result = [...this.parts];
    if (this.showLowStock) {
      result = result.filter(p => p.quantityInStock < p.reorderLevel);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.partName.toLowerCase().includes(term) ||
        p.partNumber.toLowerCase().includes(term) ||
        p.supplier.toLowerCase().includes(term)
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

    this.filteredParts = result;
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

  get paginatedParts(): Part[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredParts.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  isLowStock(p: Part): boolean {
    return p.quantityInStock < p.reorderLevel;
  }

  getPrice(p: Part): number {
    return p.unitPrice || 0;
  }

  orderPart(p: Part) {
    this.router.navigate(['/app/part-orders'], { queryParams: { orderPartId: p.partId } });
  }

  deletePart(p: Part) {
    if (!confirm(`Are you sure you want to delete "${p.partName}"? This action cannot be undone.`)) return;

    this.api.delete<boolean>(`/parts/${p.partId}`).subscribe({
      next: res => {
        if (res.success) {
          this.parts = this.parts.filter(part => part.partId !== p.partId);
          this.applyFilters();
          alert('Part deleted successfully');
        } else {
          alert(res.message || 'Failed to delete part');
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete part. It may be in use by service requests.');
      }
    });
  }
}
