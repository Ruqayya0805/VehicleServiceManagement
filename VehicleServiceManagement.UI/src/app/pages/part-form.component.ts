import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Part } from '../core/models';

@Component({
  selector: 'app-part-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8 col-xl-6">
          <div class="mb-4">
            <a routerLink="/app/parts" class="text-decoration-none">
              <i class="bi bi-arrow-left me-1"></i>Back to Parts
            </a>
          </div>

          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3">
              <h5 class="mb-0">{{ isEditMode ? 'Edit Part' : 'Add New Part' }}</h5>
            </div>
            <div class="card-body p-4">
              @if (loading) {
                <div class="text-center py-5">
                  <div class="spinner-border text-primary"></div>
                </div>
              } @else {
                @if (errorMessage) {
                  <div class="alert alert-danger">{{ errorMessage }}</div>
                }
                @if (successMessage) {
                  <div class="alert alert-success">{{ successMessage }}</div>
                }

                <form (ngSubmit)="onSubmit()" #partForm="ngForm">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Part Number <span class="text-danger">*</span></label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="part.partNumber" 
                        name="partNumber" 
                        required
                        placeholder="e.g., OIL-5W30-001">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Part Name <span class="text-danger">*</span></label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="part.partName" 
                        name="partName" 
                        required
                        placeholder="e.g., Engine Oil 5W-30">
                    </div>

                    <div class="col-12">
                      <label class="form-label">Description</label>
                      <textarea 
                        class="form-control" 
                        [(ngModel)]="part.description" 
                        name="description" 
                        rows="3"
                        placeholder="Enter part description..."></textarea>
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Unit Price (₹) <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input 
                          type="number" 
                          class="form-control" 
                          [(ngModel)]="part.unitPrice" 
                          name="unitPrice" 
                          required
                          min="0.01"
                          step="0.01"
                          placeholder="0.00">
                      </div>
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Supplier</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        [(ngModel)]="part.supplier" 
                        name="supplier"
                        placeholder="e.g., AutoParts Inc.">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Quantity in Stock <span class="text-danger">*</span></label>
                      <input 
                        type="number" 
                        class="form-control" 
                        [(ngModel)]="part.quantityInStock" 
                        name="quantityInStock" 
                        required
                        min="0"
                        placeholder="0">
                    </div>

                    <div class="col-md-6">
                      <label class="form-label">Reorder Level</label>
                      <input 
                        type="number" 
                        class="form-control" 
                        [(ngModel)]="part.reorderLevel" 
                        name="reorderLevel"
                        min="0"
                        placeholder="10">
                      <small class="text-muted">Alert when stock falls below this level</small>
                    </div>
                  </div>

                  <hr class="my-4">

                  <div class="d-flex justify-content-between">
                    <a routerLink="/app/parts" class="btn btn-outline-secondary">Cancel</a>
                    <button 
                      type="submit" 
                      class="btn btn-primary" 
                      [disabled]="!partForm.valid || submitting">
                      @if (submitting) {
                        <span class="spinner-border spinner-border-sm me-1"></span>
                      }
                      {{ isEditMode ? 'Update Part' : 'Add Part' }}
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>

          <!-- Preview Card -->
          @if (!loading && part.partName) {
            <div class="card border-0 shadow-sm mt-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0">Preview</h6>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <code class="d-block mb-1">{{ part.partNumber || 'PART-XXX-000' }}</code>
                    <h5 class="mb-1">{{ part.partName }}</h5>
                    @if (part.description) {
                      <p class="text-muted small mb-2">{{ part.description }}</p>
                    }
                    <span class="text-muted">{{ part.supplier || 'No supplier' }}</span>
                  </div>
                  <div class="text-end">
                    <div class="h4 text-primary mb-1">₹{{ part.unitPrice | number:'1.2-2' }}</div>
                    <div class="small" [class.text-danger]="part.quantityInStock < part.reorderLevel">
                      {{ part.quantityInStock || 0 }} in stock
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class PartFormComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  part: Partial<Part> & { description?: string } = {
    partNumber: '',
    partName: '',
    description: '',
    unitPrice: 0,
    quantityInStock: 0,
    reorderLevel: 10,
    supplier: ''
  };

  isEditMode = false;
  partId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.partId = +id;
      this.loadPart();
    }
  }

  loadPart() {
    this.loading = true;
    this.api.get<Part>(`/parts/${this.partId}`).subscribe({
      next: res => {
        if (res.success) {
          this.part = { ...res.data };
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load part';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      partNumber: this.part.partNumber,
      partName: this.part.partName,
      description: this.part.description || '',
      unitPrice: this.part.unitPrice,
      quantityInStock: this.part.quantityInStock,
      reorderLevel: this.part.reorderLevel || 0,
      supplier: this.part.supplier || ''
    };

    const request = this.isEditMode
      ? this.api.put(`/parts/${this.partId}`, payload)
      : this.api.post('/parts', payload);

    request.subscribe({
      next: res => {
        if (res.success) {
          this.successMessage = this.isEditMode ? 'Part updated successfully!' : 'Part added successfully!';
          setTimeout(() => this.router.navigate(['/app/parts']), 1500);
        }
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save part';
        this.submitting = false;
      }
    });
  }
}
