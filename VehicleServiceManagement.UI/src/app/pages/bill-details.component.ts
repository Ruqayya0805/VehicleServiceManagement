import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { Bill, Payment } from '../core/models';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-bill-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button class="btn btn-outline-secondary me-3" (click)="goBack()">
            <i class="bi bi-arrow-left me-1"></i>Back
          </button>
          <span class="h4 mb-0">
            <i class="bi bi-receipt me-2"></i>Bill Details
          </span>
        </div>
        @if (bill && !isCustomer) {
          <div class="d-flex gap-2">
            @if (!bill.isClosed) {
              <button class="btn btn-success" (click)="finalizeBill()" [disabled]="saving">
                @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
                <i class="bi bi-check-circle me-1"></i>Finalize & Close
              </button>
            }
            <button class="btn btn-outline-primary" (click)="downloadPdf()">
              <i class="bi bi-file-pdf me-1"></i>Download PDF
            </button>
          </div>
        }
        @if (bill && isCustomer) {
          <button class="btn btn-outline-primary" (click)="downloadPdf()">
            <i class="bi bi-file-pdf me-1"></i>Download PDF
          </button>
        }
      </div>

      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Loading bill details...</p>
        </div>
      }

      @if (!loading && !bill) {
        <div class="alert alert-danger">Bill not found</div>
      }

      @if (!loading && bill) {
        <div class="row g-4">
          <!-- Left: Bill Info & Items -->
          <div class="col-lg-8">
            <!-- Bill Header -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-primary text-white py-3">
                <div class="row">
                  <div class="col-6">
                    <h5 class="mb-1">INVOICE</h5>
                    <span class="opacity-75">{{ bill.billNumber }}</span>
                  </div>
                  <div class="col-6 text-end">
                    <span class="badge" [ngClass]="getStatusBadge(bill.paymentStatus)">{{ bill.paymentStatus }}</span>
                    @if (bill.isClosed) {
                      <span class="badge bg-dark ms-1">Closed</span>
                    }
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6 class="text-muted mb-2">BILLED TO</h6>
                    <strong>{{ bill.customerName }}</strong>
                    <p class="mb-0">{{ bill.customerEmail }}</p>
                    <p class="mb-0">{{ bill.customerPhone }}</p>
                  </div>
                  <div class="col-md-6 text-md-end">
                    <h6 class="text-muted mb-2">VEHICLE</h6>
                    <p class="mb-0">{{ bill.vehicleInfo }}</p>
                    <p class="mb-0">SR #{{ bill.serviceRequestId }}</p>
                  </div>
                </div>
                <hr>
                <div class="row">
                  <div class="col-md-6">
                    <small class="text-muted">Generated</small>
                    <p class="mb-0">{{ bill.generatedDate | date:'mediumDate' }}</p>
                  </div>
                  <div class="col-md-6 text-md-end">
                    <small class="text-muted">Due Date</small>
                    <p class="mb-0">{{ bill.dueDate | date:'mediumDate' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Service Items (Categories + Tasks) -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-tools me-2"></i>Services</h6>
              </div>
              <div class="card-body p-0">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Service</th>
                      <th class="text-end" style="width: 180px;">{{ isCustomer || bill.isClosed ? 'Price' : 'Adjusted Price' }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Service Categories -->
                    @for (item of bill.serviceItems; track item.categoryId) {
                      <tr>
                        <td>{{ item.categoryName }}</td>
                        <td class="text-end">
                          @if (!isCustomer && !bill.isClosed) {
                            <input type="number" class="form-control form-control-sm text-end" 
                              style="width: 120px; display: inline-block;"
                              [(ngModel)]="editedServicePrices[item.categoryId]"
                              (ngModelChange)="onPriceChange()">
                          } @else {
                            <strong>₹{{ item.adjustedPrice | number:'1.0-0' }}</strong>
                          }
                        </td>
                      </tr>
                    }
                    <!-- Custom Tasks from Issue Description -->
                    @for (task of bill.tasks; track task.serviceTaskId) {
                      <tr [class.table-success]="task.isCompleted" [class.table-info]="isAdditionalCharge(task)">
                        <td>
                          @if (task.isCompleted && !isAdditionalCharge(task)) {
                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                          }
                          @if (isAdditionalCharge(task)) {
                            <i class="bi bi-plus-circle-fill text-info me-2"></i>
                          }
                          <span>{{ getDisplayDescription(task.description) }}</span>
                          @if (task.completedByName && !isAdditionalCharge(task)) {
                            <small class="d-block text-success ms-4">Completed by {{ task.completedByName }}</small>
                          }
                        </td>
                        <td class="text-end">
                          @if (!isCustomer && !bill.isClosed) {
                            <div class="d-flex align-items-center justify-content-end gap-2">
                              <input type="number" class="form-control form-control-sm text-end" 
                                style="width: 120px;"
                                [(ngModel)]="editedTaskPrices[task.serviceTaskId]"
                                (blur)="onTaskPriceChange(task)"
                                min="0" step="0.01">
                              @if (isAdditionalCharge(task)) {
                                <button class="btn btn-sm btn-outline-danger" 
                                  (click)="removeAdditionalCharge(task)" 
                                  title="Remove">
                                  <i class="bi bi-trash"></i>
                                </button>
                              }
                            </div>
                          } @else {
                            <strong>₹{{ task.price || 0 | number:'1.0-0' }}</strong>
                          }
                        </td>
                      </tr>
                    }
                    <!-- Add Additional Charge Row (Service Manager Only) -->
                    @if (!isCustomer && !bill.isClosed) {
                      <tr class="table-warning">
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-plus-lg text-warning"></i>
                            <input type="text" class="form-control form-control-sm" 
                              [(ngModel)]="newChargeTitle" 
                              placeholder="Additional charge title"
                              style="max-width: 300px;">
                          </div>
                        </td>
                        <td class="text-end">
                          <div class="d-flex align-items-center justify-content-end gap-2">
                            <input type="number" class="form-control form-control-sm text-end" 
                              style="width: 120px;"
                              [(ngModel)]="newChargeAmount"
                              placeholder="Amount"
                              min="0" step="0.01">
                            <button class="btn btn-sm btn-success" 
                              (click)="addAdditionalCharge()" 
                              [disabled]="!newChargeTitle || !newChargeAmount || newChargeAmount <= 0 || addingCharge"
                              title="Add Charge">
                              @if (addingCharge) {
                                <span class="spinner-border spinner-border-sm"></span>
                              } @else {
                                <i class="bi bi-plus"></i>
                              }
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot class="table-secondary">
                    <tr>
                      <th class="text-end">Service Charge:</th>
                      <th class="text-end">₹{{ calculatedServiceCharge | number:'1.0-0' }}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Parts Items -->
            @if (bill.partItems && bill.partItems.length > 0) {
              <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-box-seam me-2"></i>Parts Used</h6>
                </div>
                <div class="card-body p-0">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Part</th>
                        <th>Part Number</th>
                        <th class="text-center">Qty</th>
                        <th class="text-end">Unit Price</th>
                        <th class="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (part of bill.partItems; track part.partId) {
                        <tr>
                          <td>{{ part.partName }}</td>
                          <td><code>{{ part.partNumber }}</code></td>
                          <td class="text-center">{{ part.quantity }}</td>
                          <td class="text-end">₹{{ part.unitPrice | number:'1.0-0' }}</td>
                          <td class="text-end"><strong>₹{{ part.totalPrice | number:'1.0-0' }}</strong></td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="table-secondary">
                      <tr>
                        <th colspan="4" class="text-end">Parts Charge:</th>
                        <th class="text-end">₹{{ bill.partsCharge | number:'1.0-0' }}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            }
          </div>

          <!-- Right: Summary & Payment -->
          <div class="col-lg-4">
            <!-- Bill Summary -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>Bill Summary</h6>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                  <span>Service Charge:</span>
                  <span>₹{{ calculatedServiceCharge | number:'1.0-0' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Parts Charge:</span>
                  <span>₹{{ bill.partsCharge | number:'1.0-0' }}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-2">
                  <span>Sub Total:</span>
                  <strong>₹{{ calculatedSubTotal | number:'1.0-0' }}</strong>
                </div>
                
                <!-- Discount Input (Service Manager) -->
                @if (!isCustomer && !bill.isClosed) {
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>Discount (%):</span>
                    <div class="input-group" style="width: 120px;">
                      <input type="number" class="form-control form-control-sm text-end" 
                        [(ngModel)]="discountPercentage" (ngModelChange)="onPriceChange()"
                        min="0" max="100">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                } @else {
                  <div class="d-flex justify-content-between mb-2">
                    <span>Discount ({{ bill.discountPercentage }}%):</span>
                    <span class="text-success">-₹{{ calculatedDiscount | number:'1.0-0' }}</span>
                  </div>
                }
                
                <div class="d-flex justify-content-between mb-2">
                  <span>Tax (10%):</span>
                  <span>₹{{ calculatedTax | number:'1.0-0' }}</span>
                </div>
                
                @if (!isCustomer && !bill.isClosed) {
                  <div class="d-flex justify-content-between mb-2 text-success">
                    <span>Discount Amount:</span>
                    <span>-₹{{ calculatedDiscount | number:'1.0-0' }}</span>
                  </div>
                }
                
                <hr>
                <div class="d-flex justify-content-between mb-2">
                  <strong class="fs-5">Total:</strong>
                  <strong class="fs-5 text-primary">₹{{ calculatedTotal | number:'1.0-0' }}</strong>
                </div>
                <div class="d-flex justify-content-between mb-2">
                  <span>Amount Paid:</span>
                  <span class="text-success">₹{{ bill.amountPaid | number:'1.0-0' }}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <strong>Balance Due:</strong>
                  <strong [class.text-danger]="calculatedBalance > 0">₹{{ calculatedBalance | number:'1.0-0' }}</strong>
                </div>

                @if (!isCustomer && !bill.isClosed && hasChanges) {
                  <hr>
                  <button class="btn btn-primary w-100" (click)="saveBill()" [disabled]="saving">
                    @if (saving) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-save me-1"></i>Save Changes
                  </button>
                }
              </div>
            </div>

            <!-- Payment Section (Customer) -->
            @if (isCustomer && bill.isClosed && calculatedBalance > 0) {
              <div class="card border-0 shadow-sm mb-4 border-primary" style="border-width: 2px !important;">
                <div class="card-header bg-primary text-white py-3">
                  <h6 class="mb-0"><i class="bi bi-credit-card me-2"></i>Make Payment</h6>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <label class="form-label">Amount</label>
                    <div class="input-group">
                      <span class="input-group-text">₹</span>
                      <input type="number" class="form-control" [(ngModel)]="paymentAmount" 
                        [max]="calculatedBalance" min="1">
                    </div>
                    <small class="text-muted">Balance: ₹{{ calculatedBalance | number:'1.0-0' }}</small>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Payment Method</label>
                    <select class="form-select" [(ngModel)]="paymentMethod">
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="NetBanking">Net Banking</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Transaction ID (optional)</label>
                    <input type="text" class="form-control" [(ngModel)]="transactionId" 
                      placeholder="Enter transaction reference">
                  </div>
                  <button class="btn btn-success w-100" (click)="makePayment()" 
                    [disabled]="makingPayment || !paymentAmount || paymentAmount <= 0">
                    @if (makingPayment) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-check-circle me-1"></i>Pay ₹{{ paymentAmount | number:'1.0-0' }}
                  </button>
                </div>
              </div>
            }

            <!-- Payment History -->
            @if (payments.length > 0) {
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-clock-history me-2"></i>Payment History</h6>
                </div>
                <div class="card-body p-0">
                  <ul class="list-group list-group-flush">
                    @for (p of payments; track p.paymentId) {
                      <li class="list-group-item">
                        <div class="d-flex justify-content-between">
                          <div>
                            <strong class="text-success">₹{{ p.amountPaid | number:'1.0-0' }}</strong>
                            <span class="badge bg-secondary ms-2">{{ p.paymentMethod }}</span>
                          </div>
                          <small class="text-muted">{{ p.paymentDate | date:'shortDate' }}</small>
                        </div>
                        @if (p.transactionId) {
                          <small class="text-muted d-block">Ref: {{ p.transactionId }}</small>
                        }
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }

            <!-- Not Finalized Warning -->
            @if (isCustomer && !bill.isClosed) {
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                This bill is being prepared. You will be able to make payment once it is finalized.
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class BillDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  bill: Bill | null = null;
  payments: Payment[] = [];
  loading = true;
  saving = false;
  editedServicePrices: { [categoryId: number]: number } = {};
  editedTaskPrices: { [taskId: number]: number } = {};
  discountPercentage = 0;
  originalServicePrices: { [categoryId: number]: number } = {};
  originalDiscount = 0;
  paymentAmount = 0;
  paymentMethod = 'Card';
  transactionId = '';
  makingPayment = false;
  newChargeTitle = '';
  newChargeAmount = 0;
  addingCharge = false;

  get isCustomer() { return this.authService.isCustomer(); }

  get calculatedServiceCharge(): number {
    if (!this.bill) return 0;
    if (this.isCustomer || this.bill.isClosed) {
      return this.bill.serviceCharge;
    }
    const categoryTotal = Object.values(this.editedServicePrices).reduce((sum, price) => sum + (price || 0), 0);
    const taskTotal = Object.values(this.editedTaskPrices).reduce((sum, price) => sum + (price || 0), 0);
    return categoryTotal + taskTotal;
  }

  get calculatedSubTotal(): number {
    if (!this.bill) return 0;
    return this.calculatedServiceCharge + this.bill.partsCharge;
  }

  get calculatedDiscount(): number {
    return this.calculatedSubTotal * (this.discountPercentage / 100);
  }

  get calculatedTax(): number {
    if (!this.bill) return 0;
    const TAX_RATE = 10;
    return this.calculatedSubTotal * (TAX_RATE / 100);
  }

  get calculatedTotal(): number {
    return this.calculatedSubTotal - this.calculatedDiscount + this.calculatedTax;
  }

  get calculatedBalance(): number {
    if (!this.bill) return 0;
    return this.calculatedTotal - this.bill.amountPaid;
  }

  get calculatedTasksTotal(): number {
    if (!this.bill || !this.bill.tasks) return 0;
    if (this.isCustomer || this.bill.isClosed) {
      return this.bill.tasks.reduce((sum, t) => sum + (t.price || 0), 0);
    }
    return Object.values(this.editedTaskPrices).reduce((sum, price) => sum + (price || 0), 0);
  }

  get hasChanges(): boolean {
    if (!this.bill) return false;
    for (const item of this.bill.serviceItems) {
      if (this.editedServicePrices[item.categoryId] !== this.originalServicePrices[item.categoryId]) {
        return true;
      }
    }
    return this.discountPercentage !== this.originalDiscount;
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBill(parseInt(id));
    }
  }

  loadBill(id: number) {
    this.loading = true;
    if (this.isCustomer) {
      this.api.get<Bill>(`/bills/${id}`).subscribe({
        next: res => {
          if (res.success) {
            this.bill = res.data;
            this.discountPercentage = res.data.discountPercentage || 0;
            this.originalDiscount = this.discountPercentage;
            this.paymentAmount = res.data.balanceDue;
            for (const item of res.data.serviceItems || []) {
              this.editedServicePrices[item.categoryId] = item.adjustedPrice;
              this.originalServicePrices[item.categoryId] = item.adjustedPrice;
            }
            for (const task of res.data.tasks || []) {
              this.editedTaskPrices[task.serviceTaskId] = task.price || 0;
            }
          }
          this.loading = false;
          this.loadPayments(id);
        },
        error: () => this.loading = false
      });
    } else {
      this.api.post<Bill>(`/bills/${id}/recalculate`, {}).subscribe({
        next: res => {
          if (res.success) {
            this.bill = res.data;
            this.discountPercentage = res.data.discountPercentage || 0;
            this.originalDiscount = this.discountPercentage;
            this.paymentAmount = res.data.balanceDue;
            for (const item of res.data.serviceItems || []) {
              this.editedServicePrices[item.categoryId] = item.adjustedPrice;
              this.originalServicePrices[item.categoryId] = item.adjustedPrice;
            }
            for (const task of res.data.tasks || []) {
              this.editedTaskPrices[task.serviceTaskId] = task.price || 0;
            }
          }
          this.loading = false;
          this.loadPayments(id);
        },
        error: () => this.loading = false
      });
    }
  }

  loadPayments(billId: number) {
    this.api.get<Payment[]>(`/payments/bill/${billId}`).subscribe({
      next: res => {
        this.payments = res.success ? res.data : [];
      }
    });
  }

  onPriceChange() {
  }

  onTaskPriceChange(task: any) {
    this.api.put<any>(`/servicetasks/${task.serviceTaskId}/price`, {
      price: this.editedTaskPrices[task.serviceTaskId] || 0
    }).subscribe({
      next: (res) => {
        if (res.success) {
          task.price = this.editedTaskPrices[task.serviceTaskId] || 0;
          this.recalculateBill();
        }
      },
      error: () => { }
    });
  }

  isAdditionalCharge(task: any): boolean {
    return task.description?.startsWith('[Additional]') || task.description?.startsWith('[Extra]');
  }

  getDisplayDescription(description: string): string {
    if (description.startsWith('[Additional] ')) {
      return description.replace('[Additional] ', '');
    }
    if (description.startsWith('[Extra] ')) {
      return description.replace('[Extra] ', '');
    }
    return description;
  }

  addAdditionalCharge() {
    if (!this.bill || !this.newChargeTitle || !this.newChargeAmount || this.newChargeAmount <= 0) return;

    this.addingCharge = true;
    const chargeData = {
      serviceRequestId: this.bill.serviceRequestId,
      title: this.newChargeTitle,
      amount: this.newChargeAmount
    };

    this.api.post<any>('/servicetasks/additional-charge', chargeData).subscribe({
      next: (res) => {
        if (res.success && this.bill) {
          this.bill.tasks = this.bill.tasks || [];
          this.bill.tasks.push(res.data);
          this.editedTaskPrices[res.data.serviceTaskId] = res.data.price || 0;
          this.newChargeTitle = '';
          this.newChargeAmount = 0;
          this.recalculateBill();
        }
        this.addingCharge = false;
      },
      error: () => this.addingCharge = false
    });
  }

  removeAdditionalCharge(task: any) {
    if (!this.bill || !confirm('Are you sure you want to remove this additional charge?')) return;

    this.api.delete<any>(`/servicetasks/${task.serviceTaskId}`).subscribe({
      next: (res) => {
        if (res.success && this.bill) {
          this.bill.tasks = this.bill.tasks?.filter(t => t.serviceTaskId !== task.serviceTaskId) || [];
          delete this.editedTaskPrices[task.serviceTaskId];
          this.recalculateBill();
        }
      },
      error: () => { }
    });
  }

  recalculateBill() {
    if (!this.bill) return;

    this.api.post<Bill>(`/bills/${this.bill.billId}/recalculate`, {}).subscribe({
      next: res => {
        if (res.success) {
          this.bill = res.data;
        }
      },
      error: () => { }
    });
  }

  saveBill() {
    if (!this.bill) return;

    this.saving = true;
    const updateData = {
      serviceItemPrices: this.editedServicePrices,
      discountPercentage: this.discountPercentage,
      finalizeBill: false
    };

    this.api.put<Bill>(`/bills/${this.bill.billId}`, updateData).subscribe({
      next: res => {
        if (res.success) {
          this.bill = res.data;
          this.originalDiscount = this.discountPercentage;
          for (const item of res.data.serviceItems || []) {
            this.originalServicePrices[item.categoryId] = item.adjustedPrice;
          }
        }
        this.saving = false;
      },
      error: () => this.saving = false
    });
  }

  finalizeBill() {
    if (!this.bill) return;

    if (!confirm('Are you sure you want to finalize this bill? This will:\n• Lock the bill (no further edits allowed)\n• Close the service request\n• Send notification to the customer')) {
      return;
    }

    this.saving = true;
    const updateData = {
      serviceItemPrices: this.editedServicePrices,
      discountPercentage: this.discountPercentage,
      finalizeBill: true
    };

    this.api.put<Bill>(`/bills/${this.bill.billId}`, updateData).subscribe({
      next: res => {
        if (res.success) {
          this.bill = res.data;
          alert('Bill finalized successfully! Customer has been notified.');
        }
        this.saving = false;
      },
      error: () => this.saving = false
    });
  }

  makePayment() {
    if (!this.bill || !this.paymentAmount || this.paymentAmount <= 0) return;

    this.makingPayment = true;
    const paymentData = {
      billId: this.bill.billId,
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      transactionId: this.transactionId || null
    };

    this.api.post<Payment>('/payments/pay', paymentData).subscribe({
      next: res => {
        if (res.success) {
          this.payments.unshift(res.data);
          if (this.bill) {
            this.bill.amountPaid += this.paymentAmount;
            this.bill.balanceDue = this.bill.totalAmount - this.bill.amountPaid;
            this.paymentAmount = this.bill.balanceDue;
            if (this.bill.balanceDue <= 0) {
              this.bill.paymentStatus = 'Paid';
            } else {
              this.bill.paymentStatus = 'PartiallyPaid';
            }
          }
          this.transactionId = '';
        }
        this.makingPayment = false;
      },
      error: (err) => {
        this.makingPayment = false;
        alert(err?.error?.message || 'Failed to process payment');
      }
    });
  }

  downloadPdf() {
    if (!this.bill) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    doc.setFontSize(22);
    doc.setTextColor(13, 110, 253);
    doc.text('Vehicle Service Center', 20, y);

    doc.setFontSize(24);
    doc.setTextColor(51, 51, 51);
    doc.text('INVOICE', pageWidth - 20, y, { align: 'right' });

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(this.bill.billNumber, 20, y);
    doc.text(`Date: ${new Date(this.bill.generatedDate).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' });

    y += 5;
    doc.text(`Due: ${new Date(this.bill.dueDate).toLocaleDateString()}`, pageWidth - 20, y, { align: 'right' });
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 15;
    doc.setFontSize(11);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 20, y);
    doc.text('Vehicle:', pageWidth - 80, y);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(this.bill.customerName, 20, y);
    doc.text(this.bill.vehicleInfo, pageWidth - 80, y);

    y += 5;
    doc.setFontSize(9);
    doc.text(this.bill.customerEmail, 20, y);
    doc.text(`SR #${this.bill.serviceRequestId}`, pageWidth - 80, y);

    y += 5;
    doc.text(this.bill.customerPhone, 20, y);
    y += 15;
    doc.setFillColor(248, 249, 250);
    doc.rect(20, y, pageWidth - 40, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Service', 25, y + 6);
    doc.text('Amount', pageWidth - 25, y + 6, { align: 'right' });

    y += 8;
    doc.setFont('helvetica', 'normal');
    for (const item of this.bill.serviceItems) {
      y += 8;
      doc.text(item.categoryName, 25, y);
      doc.text(`Rs. ${item.adjustedPrice.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });
    }
    if (this.bill.tasks && this.bill.tasks.length > 0) {
      for (const task of this.bill.tasks) {
        y += 8;
        doc.text(this.getDisplayDescription(task.description), 25, y);
        doc.text(`Rs. ${(task.price || 0).toLocaleString()}`, pageWidth - 25, y, { align: 'right' });
      }
    }
    if (this.bill.partItems && this.bill.partItems.length > 0) {
      y += 15;
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y, pageWidth - 40, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Part', 25, y + 6);
      doc.text('Qty', 100, y + 6);
      doc.text('Unit Price', 130, y + 6);
      doc.text('Total', pageWidth - 25, y + 6, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      for (const part of this.bill.partItems) {
        y += 8;
        doc.text(part.partName.substring(0, 30), 25, y);
        doc.text(part.quantity.toString(), 100, y);
        doc.text(`Rs. ${part.unitPrice.toLocaleString()}`, 130, y);
        doc.text(`Rs. ${part.totalPrice.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });
      }
    }
    y += 20;
    const summaryX = pageWidth - 90;
    doc.setDrawColor(200, 200, 200);
    doc.line(summaryX, y, pageWidth - 20, y);

    y += 8;
    doc.setFontSize(10);
    doc.text('Service Charge:', summaryX, y);
    doc.text(`Rs. ${this.bill.serviceCharge.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 7;
    doc.text('Parts Charge:', summaryX, y);
    doc.text(`Rs. ${this.bill.partsCharge.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 7;
    doc.text('Sub Total:', summaryX, y);
    doc.text(`Rs. ${this.bill.subTotal.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 7;
    doc.setTextColor(40, 167, 69);
    doc.text(`Discount (${this.bill.discountPercentage}%):`, summaryX, y);
    doc.text(`-Rs. ${this.bill.discount.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 7;
    doc.setTextColor(51, 51, 51);
    doc.text(`Tax (10%):`, summaryX, y);
    doc.text(`Rs. ${this.bill.tax.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 3;
    doc.line(summaryX, y, pageWidth - 20, y);

    y += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', summaryX, y);
    doc.setTextColor(13, 110, 253);
    doc.text(`Rs. ${this.bill.totalAmount.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.text('Amount Paid:', summaryX, y);
    doc.setTextColor(40, 167, 69);
    doc.text(`Rs. ${this.bill.amountPaid.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });

    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Balance Due:', summaryX, y);
    if (this.bill.balanceDue > 0) {
      doc.setTextColor(220, 53, 69);
    }
    doc.text(`Rs. ${this.bill.balanceDue.toLocaleString()}`, pageWidth - 25, y, { align: 'right' });
    y = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(8);
    doc.text('For queries, please contact us at support@vehicleservice.com', pageWidth / 2, y, { align: 'center' });
    doc.save(`Invoice_${this.bill.billNumber}.pdf`);
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'PartiallyPaid': return 'bg-warning text-dark';
      default: return 'bg-secondary';
    }
  }

  goBack() {
    this.router.navigate(['/app/bills']);
  }
}
