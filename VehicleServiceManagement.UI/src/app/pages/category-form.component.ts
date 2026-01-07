import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ServiceCategory } from '../core/models';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12 col-lg-8">
          <div class="d-flex align-items-center mb-4">
            <a routerLink="/app/categories" class="btn btn-outline-secondary me-3">
              <i class="bi bi-arrow-left"></i>
            </a>
            <h4 class="mb-0">{{ isEditMode ? 'Edit Category' : 'Add New Category' }}</h4>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              @if (error) {
                <div class="alert alert-danger">{{ error }}</div>
              }
              @if (success) {
                <div class="alert alert-success">{{ success }}</div>
              }

              @if (loading) {
                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
              }

              @if (!loading) {
                <form (ngSubmit)="submit()">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Category Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="form.categoryName" name="categoryName" 
                             placeholder="e.g., Oil Change" required maxlength="100">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Base Price (₹) <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control" [(ngModel)]="form.basePrice" name="basePrice" 
                               placeholder="0.00" required min="0" step="0.01">
                      </div>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description</label>
                    <textarea class="form-control" [(ngModel)]="form.description" name="description" 
                              rows="3" placeholder="Describe the service..." maxlength="500"></textarea>
                    <small class="text-muted">{{ form.description?.length || 0 }}/500 characters</small>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Estimated Duration (minutes) <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <input type="number" class="form-control" [(ngModel)]="form.estimatedDurationMinutes" 
                               name="estimatedDurationMinutes" placeholder="30" required min="1" max="10080">
                        <span class="input-group-text">min</span>
                      </div>
                      <small class="text-muted">{{ formatDuration(form.estimatedDurationMinutes) }}</small>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">Status</label>
                      <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="form.isActive" name="isActive" id="isActive">
                        <label class="form-check-label" for="isActive">
                          {{ form.isActive ? 'Active' : 'Inactive' }}
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Preview Card -->
                  <div class="card bg-light border-0 mb-4">
                    <div class="card-body">
                      <h6 class="card-title text-muted mb-3"><i class="bi bi-eye me-2"></i>Preview</h6>
                      <div class="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 class="mb-1">{{ form.categoryName || 'Category Name' }}</h5>
                          <p class="text-muted small mb-2">{{ form.description || 'Description will appear here' }}</p>
                          <span class="badge" [ngClass]="form.isActive ? 'bg-success' : 'bg-secondary'">
                            {{ form.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </div>
                        <div class="text-end">
                          <h5 class="text-primary mb-1">₹{{ form.basePrice || 0 | number:'1.2-2' }}</h5>
                          <small class="text-muted">{{ form.estimatedDurationMinutes || 0 }} min</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="d-flex justify-content-between pt-3 border-top">
                    <a routerLink="/app/categories" class="btn btn-outline-secondary btn-lg">
                      <i class="bi bi-x-lg me-2"></i>Cancel
                    </a>
                    <button type="submit" class="btn btn-primary btn-lg" 
                            [disabled]="saving || !form.categoryName || !form.basePrice || !form.estimatedDurationMinutes">
                      @if (saving) { 
                        <span class="spinner-border spinner-border-sm me-2"></span>Saving...
                      } @else {
                        <i class="bi bi-check-lg me-2"></i>{{ isEditMode ? 'Update Category' : 'Create Category' }}
                      }
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CategoryFormComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = false;
  saving = false;
  error = '';
  success = '';
  isEditMode = false;
  categoryId: number | null = null;

  form = {
    categoryName: '',
    description: '',
    basePrice: 0,
    estimatedDurationMinutes: 30,
    isActive: true
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.categoryId = Number.parseInt(id);
      this.loadCategory();
    }
  }

  loadCategory() {
    this.loading = true;
    this.api.get<ServiceCategory[]>('/servicecategories').subscribe({
      next: res => {
        if (res.success) {
          const category = res.data.find(c => c.categoryId === this.categoryId);
          if (category) {
            this.form = {
              categoryName: category.categoryName,
              description: category.description,
              basePrice: category.basePrice,
              estimatedDurationMinutes: category.estimatedDurationMinutes,
              isActive: category.isActive
            };
          } else {
            this.error = 'Category not found';
          }
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load category';
        this.loading = false;
      }
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  }

  submit() {
    if (!this.form.categoryName || !this.form.basePrice || !this.form.estimatedDurationMinutes) return;

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      categoryName: this.form.categoryName,
      description: this.form.description,
      basePrice: this.form.basePrice,
      estimatedDurationMinutes: this.form.estimatedDurationMinutes,
      isActive: this.form.isActive
    };

    const request = this.isEditMode
      ? this.api.put<ServiceCategory>(`/servicecategories/${this.categoryId}`, payload)
      : this.api.post<ServiceCategory>('/servicecategories', payload);

    request.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.success = this.isEditMode ? 'Category updated successfully!' : 'Category created successfully!';
          setTimeout(() => {
            this.router.navigate(['/app/categories']);
          }, 1500);
        } else {
          this.error = res.message || 'Failed to save category';
        }
        this.saving = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to save category';
        this.saving = false;
      }
    });
  }
}
