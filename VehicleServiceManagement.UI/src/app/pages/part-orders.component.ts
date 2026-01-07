import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { PartOrder, Part } from '../core/models';
import { PaginationComponent } from '../core/pagination.component';

@Component({
  selector: 'app-part-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
  template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">
          <i class="bi bi-cart3 me-2"></i>Part Orders
        </h4>
        <div class="d-flex gap-2">
          <button class="btn btn-primary" (click)="openOrderModal()">
            <i class="bi bi-plus-lg me-1"></i>Place Order
          </button>
          <button class="btn btn-outline-secondary" routerLink="/app/parts">
            <i class="bi bi-arrow-left me-1"></i>Back to Parts
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body py-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control" placeholder="Search by order number or part..."
                  [(ngModel)]="searchQuery" (input)="filterOrders()">
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" [(ngModel)]="statusFilter" (change)="filterOrders()">
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Ordered">Ordered</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div class="col-md-5 text-end">
              <span class="text-muted">{{ filteredOrders.length }} orders</span>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      }

      @if (!loading && filteredOrders.length === 0) {
        <div class="text-center py-5">
          <i class="bi bi-inbox fs-1 text-muted"></i>
          <p class="text-muted mt-2">No orders found</p>
        </div>
      }

      @if (!loading && filteredOrders.length > 0) {
        <div class="card border-0 shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="sortable" (click)="sort('orderNumber')">Order #
                    <i class="bi ms-1" [ngClass]="getSortIcon('orderNumber')"></i>
                  </th>
                  <th class="sortable" (click)="sort('partName')">Part
                    <i class="bi ms-1" [ngClass]="getSortIcon('partName')"></i>
                  </th>
                  <th class="text-center sortable" (click)="sort('quantity')">Quantity
                    <i class="bi ms-1" [ngClass]="getSortIcon('quantity')"></i>
                  </th>
                  <th class="text-end sortable" (click)="sort('totalAmount')">Total
                    <i class="bi ms-1" [ngClass]="getSortIcon('totalAmount')"></i>
                  </th>
                  <th class="sortable" (click)="sort('supplier')">Supplier
                    <i class="bi ms-1" [ngClass]="getSortIcon('supplier')"></i>
                  </th>
                  <th class="sortable" (click)="sort('orderDate')">Order Date
                    <i class="bi ms-1" [ngClass]="getSortIcon('orderDate')"></i>
                  </th>
                  <th>Expected Delivery</th>
                  <th class="sortable" (click)="sort('status')">Status
                    <i class="bi ms-1" [ngClass]="getSortIcon('status')"></i>
                  </th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (order of paginatedOrders; track order.partOrderId) {
                  <tr>
                    <td>
                      <strong>{{ order.orderNumber }}</strong>
                    </td>
                    <td>
                      <strong>{{ order.partName }}</strong>
                      <br>
                      <small class="text-muted">{{ order.partNumber }}</small>
                    </td>
                    <td class="text-center">{{ order.quantity }}</td>
                    <td class="text-end">
                      <strong class="text-success">₹{{ order.totalAmount | number:'1.0-0' }}</strong>
                    </td>
                    <td>{{ order.supplier }}</td>
                    <td>{{ order.orderDate | date:'mediumDate' }}</td>
                    <td>
                      @if (order.expectedDeliveryDate) {
                        {{ order.expectedDeliveryDate | date:'mediumDate' }}
                      } @else {
                        <span class="text-muted">-</span>
                      }
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getStatusClass(order.status)">{{ order.status }}</span>
                    </td>
                    <td class="text-center">
                      @if (order.status !== 'Delivered' && order.status !== 'Cancelled') {
                        <div class="btn-group btn-group-sm">
                          @if (order.status !== 'Delivered') {
                            <button class="btn btn-outline-success" title="Mark as Delivered"
                              (click)="markDelivered(order)" [disabled]="order.processing">
                              <i class="bi bi-check-lg"></i>
                            </button>
                          }
                          <button class="btn btn-outline-danger" title="Cancel Order"
                            (click)="cancelOrder(order)" [disabled]="order.processing">
                            <i class="bi bi-x-lg"></i>
                          </button>
                        </div>
                      }
                      @if (order.status === 'Delivered') {
                        <i class="bi bi-check-circle-fill text-success" title="Delivered"></i>
                      }
                      @if (order.status === 'Cancelled') {
                        <i class="bi bi-x-circle-fill text-danger" title="Cancelled"></i>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination
            [currentPage]="currentPage"
            [pageSize]="pageSize"
            [totalItems]="filteredOrders.length"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)">
          </app-pagination>
        </div>
      }

      <!-- Place Order Modal -->
      @if (showOrderModal) {
        <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title"><i class="bi bi-cart-plus me-2"></i>Place Order</h5>
                <button type="button" class="btn-close btn-close-white" (click)="closeOrderModal()"></button>
              </div>
              <div class="modal-body">
                <!-- Tab Navigation -->
                <ul class="nav nav-tabs mb-4">
                  <li class="nav-item">
                    <button class="nav-link" [class.active]="orderTab === 'existing'" (click)="orderTab = 'existing'">
                      <i class="bi bi-box-seam me-1"></i>Order Existing Part
                    </button>
                  </li>
                  <li class="nav-item">
                    <button class="nav-link" [class.active]="orderTab === 'new'" (click)="orderTab = 'new'">
                      <i class="bi bi-plus-square me-1"></i>Order New Part
                    </button>
                  </li>
                </ul>

                <!-- Order Existing Part Tab -->
                @if (orderTab === 'existing') {
                  <div class="row g-3">
                    <div class="col-12">
                      <label class="form-label">Select Part <span class="text-danger">*</span></label>
                      <select class="form-select" [(ngModel)]="existingOrder.partId" (change)="onPartSelected()">
                        <option [value]="0">-- Select a Part --</option>
                        @for (p of parts; track p.partId) {
                          <option [value]="p.partId">
                            {{ p.partName }} ({{ p.partNumber }}) - Stock: {{ p.quantityInStock }}
                          </option>
                        }
                      </select>
                    </div>
                    @if (selectedPart) {
                      <div class="col-12">
                        <div class="alert alert-light border">
                          <div class="row">
                            <div class="col-md-4">
                              <strong>Current Stock:</strong> {{ selectedPart.quantityInStock }}
                            </div>
                            <div class="col-md-4">
                              <strong>Reorder Level:</strong> {{ selectedPart.reorderLevel }}
                            </div>
                            <div class="col-md-4">
                              <strong>Supplier:</strong> {{ selectedPart.supplier }}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    <div class="col-md-6">
                      <label class="form-label">Quantity <span class="text-danger">*</span></label>
                      <input type="number" class="form-control" [(ngModel)]="existingOrder.quantity" min="1">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Unit Price</label>
                      <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control" [(ngModel)]="existingOrder.unitPrice" min="0" step="0.01">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Expected Delivery Date</label>
                      <input type="date" class="form-control" [(ngModel)]="existingOrder.expectedDeliveryDate">
                    </div>
                    <div class="col-12">
                      <label class="form-label">Notes</label>
                      <textarea class="form-control" rows="2" [(ngModel)]="existingOrder.notes" placeholder="Optional notes..."></textarea>
                    </div>
                  </div>
                }

                <!-- Order New Part Tab -->
                @if (orderTab === 'new') {
                  <div class="row g-3">
                    <div class="col-12">
                      <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        This will create a new part in inventory and place an order for it. When the order is marked as delivered, the stock will be updated.
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Part Name <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="newPartOrder.partName" placeholder="e.g. Brake Pads">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Part Number <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="newPartOrder.partNumber" placeholder="e.g. BRAKE-001">
                    </div>
                    <div class="col-12">
                      <label class="form-label">Description</label>
                      <textarea class="form-control" rows="2" [(ngModel)]="newPartOrder.description" placeholder="Part description..."></textarea>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Unit Price <span class="text-danger">*</span></label>
                      <div class="input-group">
                        <span class="input-group-text">₹</span>
                        <input type="number" class="form-control" [(ngModel)]="newPartOrder.unitPrice" min="0.01" step="0.01">
                      </div>
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Order Quantity <span class="text-danger">*</span></label>
                      <input type="number" class="form-control" [(ngModel)]="newPartOrder.quantity" min="1">
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Reorder Level</label>
                      <input type="number" class="form-control" [(ngModel)]="newPartOrder.reorderLevel" min="0">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Supplier <span class="text-danger">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="newPartOrder.supplier" placeholder="Supplier name">
                    </div>
                    <div class="col-md-6">
                      <label class="form-label">Expected Delivery Date</label>
                      <input type="date" class="form-control" [(ngModel)]="newPartOrder.expectedDeliveryDate">
                    </div>
                    <div class="col-12">
                      <label class="form-label">Order Notes</label>
                      <textarea class="form-control" rows="2" [(ngModel)]="newPartOrder.notes" placeholder="Optional notes..."></textarea>
                    </div>
                  </div>
                }

                @if (orderError) {
                  <div class="alert alert-danger mt-3">{{ orderError }}</div>
                }
              </div>
              <div class="modal-footer">
                @if (placing) {
                  <button class="btn btn-primary" disabled>
                    <span class="spinner-border spinner-border-sm me-2"></span>Placing Order...
                  </button>
                } @else {
                  <button class="btn btn-primary" (click)="placeOrder()" [disabled]="!canPlaceOrder()">
                    <i class="bi bi-check-lg me-2"></i>Place Order
                  </button>
                }
                <button type="button" class="btn btn-secondary" (click)="closeOrderModal()">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sortable { cursor: pointer; user-select: none; }
    .sortable:hover { background-color: rgba(0,0,0,0.05); }
  `]
})
export class PartOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  orders: (PartOrder & { processing?: boolean })[] = [];
  filteredOrders: (PartOrder & { processing?: boolean })[] = [];
  parts: Part[] = [];
  loading = true;

  searchQuery = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  showOrderModal = false;
  orderTab: 'existing' | 'new' = 'existing';
  placing = false;
  orderError = '';
  selectedPart: Part | null = null;

  existingOrder = {
    partId: 0,
    quantity: 1,
    unitPrice: 0,
    expectedDeliveryDate: '',
    notes: ''
  };

  newPartOrder = {
    partName: '',
    partNumber: '',
    description: '',
    unitPrice: 0,
    quantity: 1,
    reorderLevel: 5,
    supplier: '',
    expectedDeliveryDate: '',
    notes: ''
  };

  ngOnInit() {
    this.loadOrders();
    this.loadParts();
    this.route.queryParams.subscribe(params => {
      if (params['orderPartId']) {
        const partId = parseInt(params['orderPartId'], 10);
        if (partId) {
          this.existingOrder.partId = partId;
          this.openOrderModal();
        }
      }
    });
  }

  loadOrders() {
    this.loading = true;
    this.api.get<PartOrder[]>('/part-orders').subscribe({
      next: res => {
        this.orders = res.success ? res.data : [];
        this.filterOrders();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadParts() {
    this.api.get<Part[]>('/parts').subscribe({
      next: res => {
        this.parts = res.success ? res.data : [];
        if (this.existingOrder.partId) {
          this.onPartSelected();
        }
      }
    });
  }

  filterOrders() {
    let result = this.orders.filter(o => {
      const matchesSearch = !this.searchQuery ||
        o.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        o.partName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        o.partNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = !this.statusFilter || o.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
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

    this.filteredOrders = result;
    this.currentPage = 1;
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterOrders();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up text-muted';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  get paginatedOrders(): (PartOrder & { processing?: boolean })[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
  }

  openOrderModal() {
    this.showOrderModal = true;
    this.orderError = '';
    if (!this.existingOrder.partId) {
      this.resetOrderForms();
    }
  }

  closeOrderModal() {
    this.showOrderModal = false;
    this.resetOrderForms();
  }

  resetOrderForms() {
    this.existingOrder = { partId: 0, quantity: 1, unitPrice: 0, expectedDeliveryDate: '', notes: '' };
    this.newPartOrder = { partName: '', partNumber: '', description: '', unitPrice: 0, quantity: 1, reorderLevel: 5, supplier: '', expectedDeliveryDate: '', notes: '' };
    this.selectedPart = null;
    this.orderError = '';
  }

  onPartSelected() {
    const partId = +this.existingOrder.partId;
    this.selectedPart = this.parts.find(p => p.partId === partId) || null;
    if (this.selectedPart) {
      this.existingOrder.unitPrice = this.selectedPart.unitPrice;
    }
  }

  canPlaceOrder(): boolean {
    if (this.orderTab === 'existing') {
      return this.existingOrder.partId > 0 && this.existingOrder.quantity > 0;
    } else {
      return !!this.newPartOrder.partName && !!this.newPartOrder.partNumber &&
        this.newPartOrder.unitPrice > 0 && this.newPartOrder.quantity > 0 && !!this.newPartOrder.supplier;
    }
  }

  placeOrder() {
    if (this.orderTab === 'existing') {
      this.placeExistingPartOrder();
    } else {
      this.placeNewPartOrder();
    }
  }

  placeExistingPartOrder() {
    this.placing = true;
    this.orderError = '';

    const orderData: any = {
      partId: +this.existingOrder.partId,
      quantity: this.existingOrder.quantity,
      notes: this.existingOrder.notes
    };

    if (this.existingOrder.unitPrice > 0) {
      orderData.unitPrice = this.existingOrder.unitPrice;
    }
    if (this.existingOrder.expectedDeliveryDate) {
      orderData.expectedDeliveryDate = this.existingOrder.expectedDeliveryDate;
    }

    this.api.post<PartOrder>('/part-orders', orderData).subscribe({
      next: res => {
        if (res.success) {
          this.orders.unshift(res.data);
          this.filterOrders();
          this.closeOrderModal();
        }
        this.placing = false;
      },
      error: (err) => {
        this.orderError = err.error?.message || 'Failed to place order';
        this.placing = false;
      }
    });
  }

  placeNewPartOrder() {
    this.placing = true;
    this.orderError = '';
    const partData = {
      partName: this.newPartOrder.partName,
      partNumber: this.newPartOrder.partNumber,
      description: this.newPartOrder.description,
      unitPrice: this.newPartOrder.unitPrice,
      quantityInStock: 0,
      reorderLevel: this.newPartOrder.reorderLevel,
      supplier: this.newPartOrder.supplier
    };

    this.api.post<Part>('/parts', partData).subscribe({
      next: partRes => {
        if (partRes.success) {
          const orderData: any = {
            partId: partRes.data.partId,
            quantity: this.newPartOrder.quantity,
            unitPrice: this.newPartOrder.unitPrice,
            notes: this.newPartOrder.notes
          };
          if (this.newPartOrder.expectedDeliveryDate) {
            orderData.expectedDeliveryDate = this.newPartOrder.expectedDeliveryDate;
          }

          this.api.post<PartOrder>('/part-orders', orderData).subscribe({
            next: orderRes => {
              if (orderRes.success) {
                this.orders.unshift(orderRes.data);
                this.parts.push(partRes.data);
                this.filterOrders();
                this.closeOrderModal();
              }
              this.placing = false;
            },
            error: (err) => {
              this.orderError = err.error?.message || 'Part created but failed to place order';
              this.placing = false;
            }
          });
        }
      },
      error: (err) => {
        this.orderError = err.error?.message || 'Failed to create new part';
        this.placing = false;
      }
    });
  }

  markDelivered(order: PartOrder & { processing?: boolean }) {
    if (!confirm(`Mark order ${order.orderNumber} as delivered? This will add ${order.quantity} units to stock.`)) {
      return;
    }

    order.processing = true;
    this.api.post<PartOrder>(`/part-orders/${order.partOrderId}/deliver`, {}).subscribe({
      next: res => {
        if (res.success) {
          order.status = 'Delivered';
          order.deliveredDate = new Date().toISOString();
        }
        order.processing = false;
      },
      error: () => order.processing = false
    });
  }

  cancelOrder(order: PartOrder & { processing?: boolean }) {
    if (!confirm(`Cancel order ${order.orderNumber}?`)) {
      return;
    }

    order.processing = true;
    this.api.post<any>(`/part-orders/${order.partOrderId}/cancel`, {}).subscribe({
      next: res => {
        if (res.success) {
          order.status = 'Cancelled';
        }
        order.processing = false;
      },
      error: () => order.processing = false
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
