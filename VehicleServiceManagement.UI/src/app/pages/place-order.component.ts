import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Part, PartOrder, CreatePartOrder } from '../core/models';

@Component({
  selector: 'app-place-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">
          <i class="bi bi-cart-plus me-2"></i>Place Part Order
        </h4>
        <button class="btn btn-outline-secondary" routerLink="/app/parts">
          <i class="bi bi-arrow-left me-1"></i>Back to Parts
        </button>
      </div>

      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Loading part details...</p>
        </div>
      }

      @if (!loading && part) {
        <div class="row">
          <div class="col-lg-8">
            <!-- Part Info Card -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-primary text-white py-3">
                <h5 class="mb-0"><i class="bi bi-box-seam me-2"></i>Part Information</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="text-muted" style="width: 140px;">Part Name:</td>
                        <td><strong>{{ part.partName }}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Part Number:</td>
                        <td><code class="text-danger">{{ part.partNumber }}</code></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Supplier:</td>
                        <td>{{ part.supplier }}</td>
                      </tr>
                    </table>
                  </div>
                  <div class="col-md-6">
                    <table class="table table-borderless mb-0">
                      <tr>
                        <td class="text-muted" style="width: 140px;">Unit Price:</td>
                        <td><strong class="text-success">₹{{ part.unitPrice | number:'1.2-2' }}</strong></td>
                      </tr>
                      <tr>
                        <td class="text-muted">Current Stock:</td>
                        <td>
                          <span [class.text-danger]="part.quantityInStock <= part.reorderLevel"
                                [class.text-success]="part.quantityInStock > part.reorderLevel">
                            <strong>{{ part.quantityInStock }}</strong>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-muted">Reorder Level:</td>
                        <td>{{ part.reorderLevel }}</td>
                      </tr>
                    </table>
                  </div>
                </div>
                @if (part.quantityInStock <= part.reorderLevel) {
                  <div class="alert alert-warning mt-3 mb-0">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Low Stock Alert!</strong> Current stock ({{ part.quantityInStock }}) is at or below reorder level ({{ part.reorderLevel }}).
                  </div>
                }
              </div>
            </div>

            <!-- Order Form -->
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white py-3">
                <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i>Order Details</h5>
              </div>
              <div class="card-body">
                <form (ngSubmit)="submitOrder()">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <label class="form-label">Order Quantity <span class="text-danger">*</span></label>
                      <input type="number" class="form-control form-control-lg" 
                        [(ngModel)]="orderData.quantity" name="quantity"
                        min="1" required placeholder="Enter quantity to order">
                      <small class="text-muted">Suggested: {{ suggestedQuantity }} units to reach optimal stock</small>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Unit Price (₹)</label>
                      <input type="number" class="form-control form-control-lg" 
                        [(ngModel)]="orderData.unitPrice" name="unitPrice"
                        min="0" step="0.01" placeholder="Leave blank to use current price">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Expected Delivery Date</label>
                      <input type="date" class="form-control" 
                        [(ngModel)]="orderData.expectedDeliveryDate" name="expectedDeliveryDate"
                        [min]="minDate">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Supplier</label>
                      <input type="text" class="form-control" 
                        [value]="part.supplier" disabled>
                      <small class="text-muted">Order will be placed with the registered supplier</small>
                    </div>
                    <div class="col-12">
                      <label class="form-label">Notes</label>
                      <textarea class="form-control" rows="3" 
                        [(ngModel)]="orderData.notes" name="notes"
                        placeholder="Add any special instructions or notes for this order..."></textarea>
                    </div>
                  </div>

                  <hr class="my-4">

                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 class="mb-0">Estimated Total: 
                        <span class="text-primary">₹{{ estimatedTotal | number:'1.2-2' }}</span>
                      </h5>
                    </div>
                    <div>
                      <button type="button" class="btn btn-outline-secondary me-2" routerLink="/app/parts">
                        Cancel
                      </button>
                      <button type="submit" class="btn btn-primary btn-lg" 
                        [disabled]="submitting || !orderData.quantity || orderData.quantity < 1">
                        @if (submitting) {
                          <span class="spinner-border spinner-border-sm me-1"></span>
                        }
                        <i class="bi bi-cart-check me-1"></i>Place Order
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Order History Sidebar -->
          <div class="col-lg-4">
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-clock-history me-2"></i>Recent Orders for this Part</h6>
              </div>
              <div class="card-body p-0">
                @if (recentOrders.length === 0) {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-inbox fs-1"></i>
                    <p class="mb-0 mt-2">No previous orders</p>
                  </div>
                } @else {
                  <ul class="list-group list-group-flush">
                    @for (order of recentOrders; track order.partOrderId) {
                      <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{{ order.orderNumber }}</strong>
                            <br>
                            <small class="text-muted">{{ order.orderDate | date:'mediumDate' }}</small>
                          </div>
                          <div class="text-end">
                            <span class="badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
                            <br>
                            <small>Qty: {{ order.quantity }}</small>
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </div>
              <div class="card-footer bg-white">
                <a routerLink="/app/part-orders" class="btn btn-sm btn-outline-primary w-100">
                  <i class="bi bi-list me-1"></i>View All Orders
                </a>
              </div>
            </div>
          </div>
        </div>
      }

      @if (!loading && !part) {
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>Part not found
        </div>
      }
    </div>
  `
})
export class PlaceOrderComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  part: Part | null = null;
  recentOrders: any[] = [];
  loading = true;
  submitting = false;

  orderData: CreatePartOrder = {
    partId: 0,
    quantity: 0,
    unitPrice: undefined,
    expectedDeliveryDate: undefined,
    notes: ''
  };

  get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get suggestedQuantity(): number {
    if (!this.part) return 0;
    const targetStock = this.part.reorderLevel * 2;
    return Math.max(0, targetStock - this.part.quantityInStock);
  }

  get estimatedTotal(): number {
    const unitPrice = this.orderData.unitPrice ?? this.part?.unitPrice ?? 0;
    return unitPrice * (this.orderData.quantity || 0);
  }

  ngOnInit() {
    const partId = this.route.snapshot.paramMap.get('partId');
    if (partId) {
      this.orderData.partId = parseInt(partId);
      this.loadPart(parseInt(partId));
    }
  }

  loadPart(partId: number) {
    this.loading = true;
    this.api.get<Part>(`/parts/${partId}`).subscribe({
      next: res => {
        if (res.success) {
          this.part = res.data;
          this.orderData.quantity = this.suggestedQuantity || 10;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
    this.api.get<any[]>(`/part-orders/part/${partId}`).subscribe({
      next: res => {
        this.recentOrders = res.success ? res.data.slice(0, 5) : [];
      }
    });
  }

  submitOrder() {
    if (!this.orderData.quantity || this.orderData.quantity < 1) return;

    this.submitting = true;
    this.api.post<PartOrder>('/part-orders', this.orderData).subscribe({
      next: res => {
        if (res.success) {
          alert('Order placed successfully!');
          this.router.navigate(['/app/part-orders']);
        }
        this.submitting = false;
      },
      error: () => {
        alert('Failed to place order. Please try again.');
        this.submitting = false;
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Delivered': return 'bg-success';
      case 'Shipped': return 'bg-info';
      case 'Ordered': return 'bg-primary';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-warning text-dark';
    }
  }
}
