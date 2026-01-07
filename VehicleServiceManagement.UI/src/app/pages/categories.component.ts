import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ServiceCategory } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Service Categories</h4>
        <a routerLink="/app/categories/add" class="btn btn-primary"><i class="bi bi-plus-lg me-1"></i>Add Category</a>
      </div>

      <!-- Search -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" placeholder="Search categories..." [(ngModel)]="searchTerm" (ngModelChange)="onFilterChange()">
                @if (searchTerm) {
                  <button class="btn btn-outline-secondary" (click)="searchTerm = ''; onFilterChange()">
                    <i class="bi bi-x-lg"></i>
                  </button>
                }
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="col-md-3 text-end">
              <span class="text-muted">{{ sortedCategories.length }} categories found</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
      }

      @if (!loading && sortedCategories.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-tags fs-1 text-muted"></i>
          <p class="text-muted mt-2">No categories found</p>
        </div>
      }

      @if (!loading && sortedCategories.length > 0) {
        <div class="card border-0 shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="sortable" (click)="sort('categoryId')">#
                    <i class="bi ms-1" [ngClass]="getSortIcon('categoryId')"></i>
                  </th>
                  <th class="sortable" (click)="sort('categoryName')">Category Name
                    <i class="bi ms-1" [ngClass]="getSortIcon('categoryName')"></i>
                  </th>
                  <th>Description</th>
                  <th class="sortable" (click)="sort('basePrice')">Base Price
                    <i class="bi ms-1" [ngClass]="getSortIcon('basePrice')"></i>
                  </th>
                  <th class="sortable" (click)="sort('estimatedDurationMinutes')">Duration
                    <i class="bi ms-1" [ngClass]="getSortIcon('estimatedDurationMinutes')"></i>
                  </th>
                  <th class="sortable" (click)="sort('isActive')">Status
                    <i class="bi ms-1" [ngClass]="getSortIcon('isActive')"></i>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (c of paginatedCategories; track c.categoryId) {
                  <tr [class.opacity-50]="!c.isActive">
                    <td>{{ c.categoryId }}</td>
                    <td><strong>{{ c.categoryName }}</strong></td>
                    <td>{{ c.description }}</td>
                    <td><span class="fw-medium text-primary">₹{{ c.basePrice | number:'1.2-2' }}</span></td>
                    <td>{{ c.estimatedDurationMinutes }} min</td>
                    <td>
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" [checked]="c.isActive" 
                               (change)="toggleStatus(c)" [id]="'status-' + c.categoryId">
                        <label class="form-check-label" [for]="'status-' + c.categoryId">
                          <span class="badge" [ngClass]="c.isActive ? 'bg-success' : 'bg-secondary'">
                            {{ c.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </label>
                      </div>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <a [routerLink]="['/app/categories/edit', c.categoryId]" class="btn btn-outline-primary" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </a>
                        <button class="btn btn-outline-danger" title="Delete" (click)="deleteCategory(c)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalItems]="sortedCategories.length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }
    </div>
  `,
  styles: [`
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0,0,0,0.05); }
  `]
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(ApiService);

  categories: ServiceCategory[] = [];
  loading = true;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  get filteredCategories(): ServiceCategory[] {
    return this.categories.filter(c => {
      const matchesSearch = !this.searchTerm ||
        c.categoryName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = !this.statusFilter ||
        (this.statusFilter === 'active' && c.isActive) ||
        (this.statusFilter === 'inactive' && !c.isActive);
      return matchesSearch && matchesStatus;
    });
  }

  get sortedCategories(): ServiceCategory[] {
    let result = [...this.filteredCategories];
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
    return result;
  }

  get paginatedCategories(): ServiceCategory[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.sortedCategories.slice(start, start + this.pageSize);
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.get<ServiceCategory[]>('/servicecategories').subscribe({
      next: res => { this.categories = res.success ? res.data : []; this.loading = false; },
      error: () => this.loading = false
    });
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
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

  deleteCategory(category: ServiceCategory) {
    if (!confirm(`Are you sure you want to delete "${category.categoryName}"? This action cannot be undone.`)) return;

    this.api.delete(`/servicecategories/${category.categoryId}`).subscribe({
      next: res => {
        if (res.success) {
          this.categories = this.categories.filter(c => c.categoryId !== category.categoryId);
        }
      },
      error: () => {
        alert('Failed to delete category. It may be in use by service requests.');
      }
    });
  }

  toggleStatus(category: ServiceCategory) {
    const newStatus = !category.isActive;
    this.api.put<ServiceCategory>(`/servicecategories/${category.categoryId}`, { isActive: newStatus }).subscribe({
      next: res => {
        if (res.success) {
          category.isActive = newStatus;
        }
      },
      error: () => {
        alert('Failed to update status');
      }
    });
  }
}
