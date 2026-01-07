import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../core/dashboard.service';
import { ApiService } from '../core/api.service';
import {
  DashboardSummary,
  TechnicianWorkloadResponse,
  MonthlyServicesResponse,
  RevenueByCategoryResponse,
  ServicesByVehicleTypeResponse,
  FilteredServiceRequest,
  PagedResult,
  ServiceCategory
} from '../core/models';
import { forkJoin } from 'rxjs';

/**
 * Enhanced Dashboard Reports Component
 * Demonstrates data-driven dashboards consuming LINQ-based API endpoints
 * Features: Charts, Tables, Filters (Status, Priority, Date Range)
 */
@Component({
  selector: 'app-dashboard-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">
          <i class="bi bi-bar-chart-line me-2"></i>Reports
          <small class="text-muted fs-6 ms-2"></small>
        </h4>
        <div class="text-muted">
          <i class="bi bi-calendar3 me-1"></i>{{ today | date:'fullDate' }}
        </div>
      </div>
      
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Loading dashboard data...</p>
        </div>
      }

      @if (!loading) {
        <!-- Summary Cards Row -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-primary">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Total Active Services</p>
                    <h3 class="mb-0 text-primary">{{ summary?.totalActiveServices || 0 }}</h3>
                  </div>
                  <div class="text-primary opacity-50"><i class="bi bi-gear-wide-connected fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-success">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Total Revenue</p>
                    <h3 class="mb-0 text-success">₹{{ (summary?.totalRevenue || 0) | number:'1.0-0' }}</h3>
                  </div>
                  <div class="text-success opacity-50"><i class="bi bi-currency-rupee fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-info">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">This Month Revenue</p>
                    <h3 class="mb-0 text-info">₹{{ (summary?.thisMonthRevenue || 0) | number:'1.0-0' }}</h3>
                  </div>
                  <div class="text-info opacity-50"><i class="bi bi-calendar-check fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-warning">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Urgent Services</p>
                    <h3 class="mb-0 text-warning">{{ summary?.urgentServicesCount || 0 }}</h3>
                  </div>
                  <div class="text-warning opacity-50"><i class="bi bi-exclamation-triangle fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs mb-4" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link" [class.active]="activeTab === 'overview'" (click)="activeTab = 'overview'">
              <i class="bi bi-grid me-1"></i>Overview
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" [class.active]="activeTab === 'monthly'" (click)="activeTab = 'monthly'">
              <i class="bi bi-graph-up me-1"></i>Monthly Services
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" [class.active]="activeTab === 'revenue'" (click)="activeTab = 'revenue'">
              <i class="bi bi-pie-chart me-1"></i>Revenue Analysis
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" [class.active]="activeTab === 'technicians'" (click)="activeTab = 'technicians'">
              <i class="bi bi-people me-1"></i>Technician Workload
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" [class.active]="activeTab === 'filter'" (click)="switchToFilterTab()">
              <i class="bi bi-funnel me-1"></i>Service Requests
            </button>
          </li>
        </ul>

        <!-- Overview Tab -->
        @if (activeTab === 'overview') {
          <div class="row g-4">
            <!-- Service Status Distribution -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Service Status Distribution</h6>
                </div>
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-6">
                      <!-- Donut Chart -->
                      <div class="position-relative" style="height: 200px;">
                        <svg viewBox="0 0 200 200" class="w-100 h-100">
                          @if (totalServices > 0) {
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" stroke-width="25"/>
                            <!-- Completed (Green) -->
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#198754" stroke-width="25"
                              [attr.stroke-dasharray]="completedDash + ' ' + (502.65 - completedDash)"
                              stroke-dashoffset="125.66"
                              transform="rotate(-90 100 100)"/>
                            <!-- In Progress (Blue) -->
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#0d6efd" stroke-width="25"
                              [attr.stroke-dasharray]="inProgressDash + ' ' + (502.65 - inProgressDash)"
                              [attr.stroke-dashoffset]="125.66 - completedDash"
                              transform="rotate(-90 100 100)"/>
                            <!-- Pending (Orange) -->
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#ffc107" stroke-width="25"
                              [attr.stroke-dasharray]="pendingDash + ' ' + (502.65 - pendingDash)"
                              [attr.stroke-dashoffset]="125.66 - completedDash - inProgressDash"
                              transform="rotate(-90 100 100)"/>
                            <!-- Cancelled (Red) -->
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#dc3545" stroke-width="25"
                              [attr.stroke-dasharray]="cancelledDash + ' ' + (502.65 - cancelledDash)"
                              [attr.stroke-dashoffset]="125.66 - completedDash - inProgressDash - pendingDash"
                              transform="rotate(-90 100 100)"/>
                          } @else {
                            <circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" stroke-width="25"/>
                          }
                          <text x="100" y="95" text-anchor="middle" class="h4 fw-bold">{{ totalServices }}</text>
                          <text x="100" y="115" text-anchor="middle" class="small text-muted">Total</text>
                        </svg>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                          <span><span class="badge bg-success me-2">&nbsp;</span>Completed/Closed</span>
                          <strong>{{ (summary?.completedCount || 0) + (summary?.closedCount || 0) }}</strong>
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div class="progress-bar bg-success" [style.width.%]="completedPercent"></div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                          <span><span class="badge bg-primary me-2">&nbsp;</span>In Progress</span>
                          <strong>{{ summary?.inProgressCount || 0 }}</strong>
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div class="progress-bar bg-primary" [style.width.%]="inProgressPercent"></div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                          <span><span class="badge bg-warning me-2">&nbsp;</span>Pending</span>
                          <strong>{{ (summary?.requestedCount || 0) + (summary?.assignedCount || 0) }}</strong>
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div class="progress-bar bg-warning" [style.width.%]="pendingPercent"></div>
                        </div>
                      </div>
                      <div>
                        <div class="d-flex justify-content-between mb-1">
                          <span><span class="badge bg-danger me-2">&nbsp;</span>Cancelled</span>
                          <strong>{{ summary?.cancelledCount || 0 }}</strong>
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div class="progress-bar bg-danger" [style.width.%]="cancelledPercent"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Services by Vehicle Type -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-truck me-2"></i>Services by Vehicle Type</h6>
                </div>
                <div class="card-body">
                  @if (vehicleTypeData?.vehicleTypes?.length) {
                    @for (vt of vehicleTypeData.vehicleTypes; track vt.vehicleType) {
                      <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                          <span class="small">{{ vt.vehicleType }}</span>
                          <span class="small fw-medium">{{ vt.serviceCount }} ({{ vt.percentage }}%)</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                          <div class="progress-bar bg-info" [style.width.%]="vt.percentage"></div>
                        </div>
                        <small class="text-muted">Revenue: ₹{{ vt.totalRevenue | number:'1.0-0' }}</small>
                      </div>
                    }
                  } @else {
                    <div class="text-center py-4 text-muted">
                      <i class="bi bi-truck fs-1"></i>
                      <p class="mt-2">No vehicle type data available</p>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-lightning me-2"></i>Quick Stats</h6>
                </div>
                <div class="card-body">
                  <div class="row g-3 text-center">
                    <div class="col-4">
                      <div class="border rounded p-3">
                        <i class="bi bi-people text-primary fs-4"></i>
                        <h5 class="mb-0 mt-2">{{ summary?.totalCustomers || 0 }}</h5>
                        <small class="text-muted">Customers</small>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="border rounded p-3">
                        <i class="bi bi-truck text-primary fs-4"></i>
                        <h5 class="mb-0 mt-2">{{ summary?.totalVehicles || 0 }}</h5>
                        <small class="text-muted">Vehicles</small>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="border rounded p-3">
                        <i class="bi bi-person-gear text-primary fs-4"></i>
                        <h5 class="mb-0 mt-2">{{ summary?.totalTechnicians || 0 }}</h5>
                        <small class="text-muted">Technicians</small>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="border rounded p-3">
                        <i class="bi bi-tags text-primary fs-4"></i>
                        <h5 class="mb-0 mt-2">{{ summary?.totalServiceCategories || 0 }}</h5>
                        <small class="text-muted">Categories</small>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="border rounded p-3">
                        <i class="bi bi-clock-history text-success fs-4"></i>
                        <h5 class="mb-0 mt-2">{{ summary?.averageCompletionTimeHours || 0 }}h</h5>
                        <small class="text-muted">Avg. Completion</small>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="border rounded p-3" [class.border-danger]="(summary?.lowStockPartsCount || 0) > 0">
                        <i class="bi bi-box-seam fs-4" [class.text-danger]="(summary?.lowStockPartsCount || 0) > 0" [class.text-primary]="(summary?.lowStockPartsCount || 0) === 0"></i>
                        <h5 class="mb-0 mt-2" [class.text-danger]="(summary?.lowStockPartsCount || 0) > 0">{{ summary?.lowStockPartsCount || 0 }}</h5>
                        <small class="text-muted">Low Stock</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Today's Scheduled Services -->
            <div class="col-lg-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-calendar-event me-2"></i>Today's Scheduled Services</h6>
                </div>
                <div class="card-body p-0">
                  @if (summary?.todayScheduled?.length) {
                    <div class="table-responsive">
                      <table class="table table-hover mb-0">
                        <thead class="table-light">
                          <tr>
                            <th>Vehicle</th>
                            <th>Customer</th>
                            <th>Service</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (service of summary.todayScheduled; track service.serviceRequestId) {
                            <tr>
                              <td>{{ service.vehicleInfo }}</td>
                              <td>{{ service.customerName }}</td>
                              <td>{{ service.categoryName || 'Custom' }}</td>
                              <td>
                                <span class="badge" [ngClass]="{
                                  'bg-warning text-dark': service.status === 'Requested' || service.status === 'Assigned',
                                  'bg-primary': service.status === 'InProgress',
                                  'bg-success': service.status === 'Completed'
                                }">{{ service.status }}</span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="text-center py-4 text-muted">
                      <i class="bi bi-calendar-x fs-1"></i>
                      <p class="mt-2">No services scheduled for today</p>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Monthly Services Tab -->
        @if (activeTab === 'monthly') {
          <div class="row g-4">
            <div class="col-lg-8">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0"><i class="bi bi-bar-chart me-2"></i>Monthly Services</h6>
                  <div class="d-flex align-items-center gap-2">
                    <select class="form-select form-select-sm" [(ngModel)]="selectedYear" (change)="loadMonthlyData()" style="width: auto;">
                      @for (year of availableYears; track year) {
                        <option [ngValue]="year">{{ year }}</option>
                      }
                    </select>
                    <span class="badge bg-primary">{{ monthlyData?.totalServicesThisYear || 0 }} Total</span>
                  </div>
                </div>
                <div class="card-body">
                  @if (monthlyData?.monthlyData?.length) {
                    <!-- Bar Chart -->
                    <div class="row g-2 mb-4">
                      @for (month of monthlyData.monthlyData; track month.month) {
                        <div class="col">
                          <div class="text-center">
                            <div class="position-relative" style="height: 150px;">
                              <div class="position-absolute bottom-0 start-50 translate-middle-x bg-primary rounded-top" 
                                style="width: 30px;" 
                                [style.height.%]="getBarHeight(month.totalServices)">
                              </div>
                            </div>
                            <small class="text-muted d-block">{{ month.monthName.substring(0, 3) }}</small>
                            <small class="fw-bold">{{ month.totalServices }}</small>
                            @if (month.growthPercentage !== 0) {
                              <small class="d-block" [class.text-success]="month.growthPercentage > 0" [class.text-danger]="month.growthPercentage < 0">
                                {{ month.growthPercentage > 0 ? '+' : '' }}{{ month.growthPercentage | number:'1.0-0' }}%
                              </small>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Monthly Data Table -->
                    <div class="table-responsive">
                      <table class="table table-sm table-hover">
                        <thead class="table-light">
                          <tr>
                            <th>Month</th>
                            <th class="text-center">Total</th>
                            <th class="text-center">Completed</th>
                            <th class="text-center">Cancelled</th>
                            <th class="text-end">Revenue</th>
                            <th class="text-end">Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (month of monthlyData.monthlyData; track month.month) {
                            <tr>
                              <td>{{ month.monthName }}</td>
                              <td class="text-center"><span class="badge bg-secondary">{{ month.totalServices }}</span></td>
                              <td class="text-center"><span class="badge bg-success">{{ month.completedServices }}</span></td>
                              <td class="text-center"><span class="badge bg-danger">{{ month.cancelledServices }}</span></td>
                              <td class="text-end text-success">₹{{ month.totalRevenue | number:'1.0-0' }}</td>
                              <td class="text-end">
                                @if (month.growthPercentage !== 0) {
                                  <span [class.text-success]="month.growthPercentage > 0" [class.text-danger]="month.growthPercentage < 0">
                                    {{ month.growthPercentage > 0 ? '+' : '' }}{{ month.growthPercentage | number:'1.0-0' }}%
                                  </span>
                                } @else {
                                  <span class="text-muted">-</span>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  } @else {
                    <div class="text-center py-4 text-muted">
                      <i class="bi bi-graph-up fs-1"></i>
                      <p class="mt-2">No monthly data available</p>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-trophy me-2"></i>Monthly Insights</h6>
                </div>
                <div class="card-body">
                  <div class="mb-4">
                    <label class="text-muted small">Busiest Month</label>
                    <h5 class="text-success mb-0">{{ monthlyData?.busiestMonth || 'N/A' }}</h5>
                  </div>
                  <div class="mb-4">
                    <label class="text-muted small">Slowest Month</label>
                    <h5 class="text-warning mb-0">{{ monthlyData?.slowMonth || 'N/A' }}</h5>
                  </div>
                  <div class="mb-4">
                    <label class="text-muted small">Average Services/Month</label>
                    <h5 class="text-primary mb-0">{{ (monthlyData?.averageServicesPerMonth || 0) | number:'1.0-1' }}</h5>
                  </div>
                  <div>
                    <label class="text-muted small">Total Services This Year</label>
                    <h5 class="text-info mb-0">{{ monthlyData?.totalServicesThisYear || 0 }}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Revenue Analysis Tab -->
        @if (activeTab === 'revenue') {
          <div class="row g-4">
            <div class="col-lg-8">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0"><i class="bi bi-pie-chart-fill me-2"></i>Revenue by Category</h6>
                  <span class="badge bg-success fs-6">₹{{ (revenueData?.totalRevenue || 0) | number:'1.0-0' }} Total</span>
                </div>
                <div class="card-body">
                  @if (revenueData?.categories?.length) {
                    <div class="row">
                      <div class="col-md-5">
                        <!-- SVG Pie Chart -->
                        <div class="position-relative" style="height: 250px;">
                          <svg viewBox="0 0 200 200" class="w-100 h-100">
                            @for (cat of revenueData.categories; track cat.categoryId; let i = $index) {
                              <circle cx="100" cy="100" r="80" fill="none" 
                                [attr.stroke]="pieColors[i % pieColors.length]" stroke-width="30"
                                [attr.stroke-dasharray]="getPieSlice(cat.percentage) + ' ' + (502.65 - getPieSlice(cat.percentage))"
                                [attr.stroke-dashoffset]="getPieOffset(i)"
                                transform="rotate(-90 100 100)"/>
                            }
                            <text x="100" y="95" text-anchor="middle" class="h6 fw-bold">₹{{ (revenueData.totalRevenue / 1000) | number:'1.0-0' }}K</text>
                            <text x="100" y="115" text-anchor="middle" class="small text-muted">Total</text>
                          </svg>
                        </div>
                      </div>
                      <div class="col-md-7">
                        @for (cat of revenueData.categories; track cat.categoryId; let i = $index) {
                          <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                              <span>
                                <span class="d-inline-block rounded me-2" [style.backgroundColor]="pieColors[i % pieColors.length]" style="width: 12px; height: 12px;"></span>
                                {{ cat.categoryName }}
                              </span>
                              <span class="fw-medium">₹{{ cat.revenue | number:'1.0-0' }}</span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small">
                              <span>{{ cat.serviceCount }} services</span>
                              <span>{{ cat.percentage | number:'1.0-1' }}%</span>
                            </div>
                            <div class="progress mt-1" style="height: 4px;">
                              <div class="progress-bar" [style.backgroundColor]="pieColors[i % pieColors.length]" [style.width.%]="cat.percentage"></div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="text-center py-4 text-muted">
                      <i class="bi bi-pie-chart fs-1"></i>
                      <p class="mt-2">No revenue data available</p>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-trophy-fill me-2 text-warning"></i>Top Category</h6>
                </div>
                <div class="card-body text-center">
                  <i class="bi bi-award fs-1 text-warning"></i>
                  <h5 class="mt-2">{{ revenueData?.topCategory || 'N/A' }}</h5>
                  <p class="text-muted mb-0">Highest revenue generator</p>
                </div>
              </div>
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-calculator me-2"></i>Revenue Stats</h6>
                </div>
                <div class="card-body">
                  <div class="d-flex justify-content-between mb-3 pb-3 border-bottom">
                    <span class="text-muted">Total Revenue</span>
                    <span class="h5 mb-0 text-success">₹{{ (revenueData?.totalRevenue || 0) | number:'1.0-0' }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-3 pb-3 border-bottom">
                    <span class="text-muted">Total Services</span>
                    <span class="fw-medium">{{ revenueData?.totalServiceCount || 0 }}</span>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span class="text-muted">Avg per Category</span>
                    <span class="fw-medium">₹{{ (revenueData?.averageRevenuePerCategory || 0) | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Technician Workload Tab -->
        @if (activeTab === 'technicians') {
          <div class="card border-0 shadow-sm">
            <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h6 class="mb-0"><i class="bi bi-people-fill me-2"></i>Technician Workload & Performance</h6>
              <div class="d-flex gap-2">
                <span class="badge bg-secondary">{{ technicianData?.totalTechnicians || 0 }} Technicians</span>
                <span class="badge bg-primary">{{ technicianData?.totalAssignments || 0 }} Assignments</span>
                <span class="badge bg-success">{{ (technicianData?.overallCompletionRate || 0) | number:'1.0-0' }}% Completion</span>
              </div>
            </div>
            <div class="card-body p-0">
              @if (technicianData?.workloads?.length) {
                <div class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Technician</th>
                        <th class="text-center">Total</th>
                        <th class="text-center">Completed</th>
                        <th class="text-center">In Progress</th>
                        <th class="text-center">Pending</th>
                        <th>Performance</th>
                        <th class="text-center">Workload</th>
                        <th class="text-end">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (tech of technicianData.workloads; track tech.technicianId) {
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 36px; height: 36px;">
                                {{ tech.technicianName.charAt(0) }}
                              </div>
                              <div>
                                <div class="fw-medium">{{ tech.technicianName }}</div>
                                <small class="text-muted">{{ tech.email }}</small>
                              </div>
                            </div>
                          </td>
                          <td class="text-center"><span class="badge bg-secondary">{{ tech.totalAssignments }}</span></td>
                          <td class="text-center"><span class="badge bg-success">{{ tech.completedAssignments }}</span></td>
                          <td class="text-center"><span class="badge bg-primary">{{ tech.inProgressAssignments }}</span></td>
                          <td class="text-center"><span class="badge bg-warning text-dark">{{ tech.pendingAssignments }}</span></td>
                          <td>
                            <div class="d-flex align-items-center">
                              <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                <div class="progress-bar" 
                                  [class.bg-success]="tech.completionRate >= 70"
                                  [class.bg-warning]="tech.completionRate >= 40 && tech.completionRate < 70"
                                  [class.bg-danger]="tech.completionRate < 40"
                                  [style.width.%]="tech.completionRate">
                                </div>
                              </div>
                              <small class="text-muted">{{ tech.completionRate | number:'1.0-0' }}%</small>
                            </div>
                          </td>
                          <td class="text-center">
                            <span class="badge" [ngClass]="{
                              'bg-success': tech.workloadStatus === 'Low',
                              'bg-warning text-dark': tech.workloadStatus === 'Moderate',
                              'bg-danger': tech.workloadStatus === 'Heavy'
                            }">{{ tech.workloadStatus }}</span>
                          </td>
                          <td class="text-end text-success fw-medium">₹{{ tech.totalRevenueGenerated | number:'1.0-0' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="text-center py-5 text-muted">
                  <i class="bi bi-people fs-1"></i>
                  <p class="mt-2">No technician data available</p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Service Request Filter Tab -->
        @if (activeTab === 'filter') {
          <div class="row g-4">
            <!-- Filters Card -->
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3">
                  <h6 class="mb-0"><i class="bi bi-funnel me-2"></i>Filter Service Requests</h6>
                </div>
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-2">
                      <label class="form-label small">Status</label>
                      <select class="form-select form-select-sm" [(ngModel)]="filterStatus">
                        <option value="">All Statuses</option>
                        <option value="Requested">Requested</option>
                        <option value="Assigned">Assigned</option>
                        <option value="InProgress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Priority</label>
                      <select class="form-select form-select-sm" [(ngModel)]="filterPriority">
                        <option value="">All Priorities</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Category</label>
                      <select class="form-select form-select-sm" [(ngModel)]="filterCategoryId">
                        <option [ngValue]="null">All Categories</option>
                        @for (cat of categories; track cat.categoryId) {
                          <option [ngValue]="cat.categoryId">{{ cat.categoryName }}</option>
                        }
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">From Date</label>
                      <input type="date" class="form-control form-control-sm" [(ngModel)]="filterFromDate">
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">To Date</label>
                      <input type="date" class="form-control form-control-sm" [(ngModel)]="filterToDate">
                    </div>
                    <div class="col-md-2 d-flex align-items-end gap-2">
                      <button class="btn btn-primary btn-sm" (click)="applyFilters()">
                        <i class="bi bi-search me-1"></i>Filter
                      </button>
                      <button class="btn btn-success btn-sm" (click)="loadAllRequests()" title="Load all without filters">
                        <i class="bi bi-list-ul"></i>
                      </button>
                      <button class="btn btn-outline-secondary btn-sm" (click)="clearFilters()">
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filtered Results -->
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0">
                    <i class="bi bi-list-ul me-2"></i>Filtered Results
                    @if (filteredRequests) {
                      <span class="badge bg-secondary ms-2">{{ filteredRequests.totalCount }} total</span>
                    }
                  </h6>
                </div>
                <div class="card-body p-0">
                  @if (filterLoading) {
                    <div class="text-center py-4">
                      <div class="spinner-border spinner-border-sm text-primary"></div>
                      <p class="text-muted mt-2 small">Loading...</p>
                    </div>
                  } @else if (filteredRequests?.items?.length) {
                    <div class="table-responsive">
                      <table class="table table-hover mb-0">
                        <thead class="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Vehicle</th>
                            <th>Customer</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Technician</th>
                            <th class="text-end">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (req of filteredRequests.items; track req.serviceRequestId) {
                            <tr>
                              <td>#{{ req.serviceRequestId }}</td>
                              <td>
                                <div class="fw-medium">{{ req.vehicleInfo }}</div>
                                <small class="text-muted">{{ req.registrationNumber }}</small>
                              </td>
                              <td>{{ req.customerName }}</td>
                              <td>{{ req.categoryName || 'Custom' }}</td>
                              <td>
                                <span class="badge" [ngClass]="{
                                  'bg-danger': req.priority === 'Urgent',
                                  'bg-info': req.priority === 'Normal'
                                }">{{ req.priority }}</span>
                              </td>
                              <td>
                                <span class="badge" [ngClass]="{
                                  'bg-warning text-dark': req.status === 'Requested' || req.status === 'Assigned',
                                  'bg-primary': req.status === 'InProgress',
                                  'bg-success': req.status === 'Completed' || req.status === 'Closed',
                                  'bg-danger': req.status === 'Cancelled'
                                }">{{ req.status }}</span>
                              </td>
                              <td>{{ req.requestedDate | date:'shortDate' }}</td>
                              <td>{{ req.technicianName || '-' }}</td>
                              <td class="text-end">
                                <span class="text-success">₹{{ req.actualCost || req.estimatedCost | number:'1.0-0' }}</span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                    <!-- Pagination -->
                    @if (filteredRequests.totalCount > filterPageSize) {
                      <div class="d-flex justify-content-between align-items-center p-3 border-top">
                        <span class="text-muted small">
                          Showing {{ ((filterPage - 1) * filterPageSize) + 1 }} - {{ Math.min(filterPage * filterPageSize, filteredRequests.totalCount) }} of {{ filteredRequests.totalCount }}
                        </span>
                        <nav>
                          <ul class="pagination pagination-sm mb-0">
                            <li class="page-item" [class.disabled]="filterPage === 1">
                              <button class="page-link" (click)="goToPage(filterPage - 1)">Previous</button>
                            </li>
                            @for (p of getPageNumbers(); track p) {
                              <li class="page-item" [class.active]="p === filterPage">
                                <button class="page-link" (click)="goToPage(p)">{{ p }}</button>
                              </li>
                            }
                            <li class="page-item" [class.disabled]="filterPage >= getTotalPages()">
                              <button class="page-link" (click)="goToPage(filterPage + 1)">Next</button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    }
                  } @else {
                    <div class="text-center py-5 text-muted">
                      <i class="bi bi-inbox fs-1"></i>
                      @if (filterError) {
                        <p class="mt-2 text-danger">{{ filterError }}</p>
                      } @else if (filteredRequests && filteredRequests.totalCount === 0) {
                        <p class="mt-2">No service requests match the filter criteria.</p>
                      } @else {
                        <p class="mt-2">Click "Filter" or the list icon to load service requests.</p>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .progress { background-color: #f8f9fa; }
    .nav-tabs .nav-link { color: #6c757d; }
    .nav-tabs .nav-link.active { color: #0d6efd; font-weight: 500; }
  `]
})
export class DashboardReportsComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly api = inject(ApiService);

  loading = true;
  today = new Date();
  activeTab = 'overview';
  summary: DashboardSummary | null = null;
  technicianData: TechnicianWorkloadResponse | null = null;
  monthlyData: MonthlyServicesResponse | null = null;
  revenueData: RevenueByCategoryResponse | null = null;
  vehicleTypeData: ServicesByVehicleTypeResponse | null = null;
  categories: ServiceCategory[] = [];
  selectedYear = new Date().getFullYear();
  availableYears: number[] = [];
  filterStatus = '';
  filterPriority = '';
  filterCategoryId: number | null = null;
  filterFromDate = '';
  filterToDate = '';
  filterPage = 1;
  filterPageSize = 10;
  filterLoading = false;
  filterError = '';
  filteredRequests: PagedResult<FilteredServiceRequest> | null = null;
  pieColors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6c757d', '#0dcaf0', '#6610f2', '#fd7e14'];
  Math = Math;
  get totalServices(): number {
    const s = this.summary;
    return (s?.requestedCount || 0) + (s?.assignedCount || 0) + (s?.inProgressCount || 0) +
      (s?.completedCount || 0) + (s?.closedCount || 0) + (s?.cancelledCount || 0);
  }

  get completedPercent(): number {
    if (this.totalServices === 0) return 0;
    return (((this.summary?.completedCount || 0) + (this.summary?.closedCount || 0)) / this.totalServices) * 100;
  }

  get inProgressPercent(): number {
    if (this.totalServices === 0) return 0;
    return ((this.summary?.inProgressCount || 0) / this.totalServices) * 100;
  }

  get pendingPercent(): number {
    if (this.totalServices === 0) return 0;
    return (((this.summary?.requestedCount || 0) + (this.summary?.assignedCount || 0)) / this.totalServices) * 100;
  }

  get cancelledPercent(): number {
    if (this.totalServices === 0) return 0;
    return ((this.summary?.cancelledCount || 0) / this.totalServices) * 100;
  }
  get completedDash(): number { return (this.completedPercent / 100) * 502.65; }
  get inProgressDash(): number { return (this.inProgressPercent / 100) * 502.65; }
  get pendingDash(): number { return (this.pendingPercent / 100) * 502.65; }
  get cancelledDash(): number { return (this.cancelledPercent / 100) * 502.65; }

  ngOnInit() {
    this.initializeYears();
    this.loadAllData();
  }

  initializeYears() {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.availableYears.push(y);
    }
  }

  loadAllData() {
    this.loading = true;

    forkJoin({
      summary: this.dashboardService.getDashboardSummary(),
      technicians: this.dashboardService.getTechnicianWorkload(),
      monthly: this.dashboardService.getMonthlyServices(this.selectedYear),
      revenue: this.dashboardService.getRevenueByCategory(),
      vehicleTypes: this.dashboardService.getServicesByVehicleType(),
      categories: this.api.get<ServiceCategory[]>('/servicecategories')
    }).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.technicianData = res.technicians;
        this.monthlyData = res.monthly;
        this.revenueData = res.revenue;
        this.vehicleTypeData = res.vehicleTypes;
        this.categories = res.categories.success ? res.categories.data : [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadMonthlyData() {
    this.dashboardService.getMonthlyServices(this.selectedYear).subscribe({
      next: (data) => this.monthlyData = data
    });
  }
  getBarHeight(value: number): number {
    if (!this.monthlyData?.monthlyData?.length) return 0;
    const max = Math.max(...this.monthlyData.monthlyData.map(m => m.totalServices));
    return max > 0 ? (value / max) * 100 : 0;
  }
  getPieSlice(percentage: number): number {
    return (percentage / 100) * 502.65;
  }

  getPieOffset(index: number): number {
    if (!this.revenueData?.categories) return 125.66;
    let offset = 125.66;
    for (let i = 0; i < index; i++) {
      offset -= this.getPieSlice(this.revenueData.categories[i].percentage);
    }
    return offset;
  }
  switchToFilterTab() {
    this.activeTab = 'filter';
    if (!this.filteredRequests) {
      this.loadAllRequests();
    }
  }

  applyFilters() {
    this.filterPage = 1;
    this.loadFilteredRequests();
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterCategoryId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPage = 1;
    this.filteredRequests = null;
  }

  loadFilteredRequests() {
    this.filterLoading = true;
    this.filterError = '';

    this.dashboardService.getFilteredServiceRequests({
      status: this.filterStatus || undefined,
      priority: this.filterPriority || undefined,
      categoryId: this.filterCategoryId || undefined,
      fromDate: this.filterFromDate || undefined,
      toDate: this.filterToDate || undefined,
      pageNumber: this.filterPage,
      pageSize: this.filterPageSize
    }).subscribe({
      next: (data) => {
        this.filteredRequests = data;
        this.filterLoading = false;
        console.log('Filtered results:', data);
      },
      error: (err) => {
        this.filterLoading = false;
        this.filterError = err?.error?.message || 'Failed to load service requests. Please try again.';
        console.error('Filter error:', err);
      }
    });
  }

  loadAllRequests() {
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterCategoryId = null;
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterPage = 1;
    this.loadFilteredRequests();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.getTotalPages()) return;
    this.filterPage = page;
    this.loadFilteredRequests();
  }

  getTotalPages(): number {
    if (!this.filteredRequests) return 0;
    return Math.ceil(this.filteredRequests.totalCount / this.filterPageSize);
  }

  getPageNumbers(): number[] {
    const total = this.getTotalPages();
    const pages: number[] = [];
    const start = Math.max(1, this.filterPage - 2);
    const end = Math.min(total, this.filterPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
