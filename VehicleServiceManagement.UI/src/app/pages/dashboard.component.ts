import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import {
  DashboardReport,
  TechnicianWorkloadReport,
  VehicleServiceHistory,
  Vehicle,
  AdminDashboard
} from '../core/models';
import { forkJoin } from 'rxjs';
interface CustomerGrievance {
  id: number;
  customerName: string;
  serviceId: number;
  remark: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Unresolved' | 'In Progress' | 'Resolved';
  date: Date;
}

interface TechnicianRemark {
  id: number;
  technicianName: string;
  serviceId: number;
  jobNote: string;
  timestamp: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Dashboard</h4>
        @if (isAdmin || isManager) {
          <div class="text-muted">
            <i class="bi bi-calendar3 me-1"></i>{{ today | date:'fullDate' }}
          </div>
        }
      </div>
      
      @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
          <p class="text-muted mt-2">Loading dashboard...</p>
        </div>
      }

      <!-- Admin Dashboard -->
      @if (!loading && isAdmin) {
        <div class="row g-4">
          <!-- Left Column -->
          <div class="col-lg-8">
            <!-- Staff Pending Approval -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-person-check me-2"></i>Staff Pending Approval</h6>
                <a routerLink="/app/users" class="btn btn-sm btn-outline-primary">View All</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.pendingApprovals?.length) {
                  <div class="list-group list-group-flush">
                    @for (user of adminDashboard.pendingApprovals; track user.userId) {
                      <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                          <div class="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            {{ user.fullName.charAt(0) }}
                          </div>
                          <div>
                            <div class="fw-medium">{{ user.fullName }}</div>
                            <small class="text-muted">{{ user.email }}</small>
                          </div>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-secondary">{{ user.role }}</span>
                          <small class="d-block text-muted mt-1">{{ user.createdDate | date:'shortDate' }}</small>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle fs-1 text-success"></i>
                    <p class="mt-2 mb-0">No pending approvals</p>
                  </div>
                }
              </div>
            </div>

            <!-- New Users (Last 7 Days) -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-person-plus me-2"></i>New Users (Last 7 Days)</h6>
                <a routerLink="/app/users" class="btn btn-sm btn-outline-primary">View All</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.newUsers?.length) {
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>User</th>
                          <th>Role</th>
                          <th class="text-end">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (user of adminDashboard.newUsers; track user.userId) {
                          <tr>
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                  {{ user.fullName.charAt(0) }}
                                </div>
                                <div>
                                  <div class="fw-medium">{{ user.fullName }}</div>
                                  <small class="text-muted">{{ user.email }}</small>
                                </div>
                              </div>
                            </td>
                            <td><span class="badge" [ngClass]="getRoleBadgeClass(user.role)">{{ user.role }}</span></td>
                            <td class="text-end text-muted small">{{ user.createdDate | date:'shortDate' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-people fs-1"></i>
                    <p class="mt-2 mb-0">No new users this week</p>
                  </div>
                }
              </div>
            </div>

            <!-- Top Service Categories -->
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-trophy me-2"></i>Top Service Categories</h6>
                <a routerLink="/app/service-categories" class="btn btn-sm btn-outline-primary">Manage</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.topCategories?.length) {
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>#</th>
                          <th>Category</th>
                          <th class="text-center">Services</th>
                          <th class="text-end">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (cat of adminDashboard.topCategories; track cat.categoryId; let i = $index) {
                          <tr>
                            <td>
                              <span class="badge" [ngClass]="i === 0 ? 'bg-warning text-dark' : i === 1 ? 'bg-secondary' : i === 2 ? 'bg-danger' : 'bg-light text-dark'">
                                {{ i + 1 }}
                              </span>
                            </td>
                            <td class="fw-medium">{{ cat.categoryName }}</td>
                            <td class="text-center"><span class="badge bg-primary">{{ cat.serviceCount }}</span></td>
                            <td class="text-end text-success fw-medium">₹{{ cat.revenue | number:'1.0-0' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-grid fs-1"></i>
                    <p class="mt-2 mb-0">No category data available</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-lg-4">
            <!-- Top Parts Used -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-tools me-2"></i>Top Parts Used</h6>
                <a routerLink="/app/parts" class="btn btn-sm btn-outline-primary">View All</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.topParts?.length) {
                  <ul class="list-group list-group-flush">
                    @for (part of adminDashboard.topParts; track part.partId; let i = $index) {
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div class="d-flex align-items-center">
                            <span class="badge me-2" [ngClass]="i === 0 ? 'bg-warning text-dark' : 'bg-light text-dark'">{{ i + 1 }}</span>
                            <div>
                              <div class="fw-medium">{{ part.partName }}</div>
                              <small class="text-muted">{{ part.partNumber }}</small>
                            </div>
                          </div>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-info">{{ part.totalUsed }} used</span>
                          <small class="d-block text-success mt-1">₹{{ part.revenue | number:'1.0-0' }}</small>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-box-seam fs-1"></i>
                    <p class="mt-2 mb-0">No parts usage data</p>
                  </div>
                }
              </div>
            </div>

            <!-- Low Stock Alert -->
            <div class="card border-0 shadow-sm border-danger" [class.border-2]="adminDashboard?.lowStockParts?.length">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Low Stock Alert</h6>
                <a routerLink="/app/parts" class="btn btn-sm btn-outline-danger">Manage</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.lowStockParts?.length) {
                  <ul class="list-group list-group-flush">
                    @for (part of adminDashboard.lowStockParts; track part.partId) {
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div class="fw-medium">{{ part.partName }}</div>
                          <small class="text-muted">{{ part.partNumber }}</small>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-danger">{{ part.currentStock }} left</span>
                          <small class="d-block text-muted mt-1">Min: {{ part.minimumStock }}</small>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle fs-1 text-success"></i>
                    <p class="mt-2 mb-0">All parts are well stocked</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Service Manager Dashboard -->
      @if (!loading && isManager) {
        <!-- Summary Cards Row -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Pending Services</p>
                    <h3 class="mb-0 text-warning">{{ dashboard?.serviceStatusSummary?.pending || 0 }}</h3>
                  </div>
                  <div class="text-warning opacity-50"><i class="bi bi-clock-history fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Completed Services</p>
                    <h3 class="mb-0 text-success">{{ dashboard?.serviceStatusSummary?.completed || 0 }}</h3>
                  </div>
                  <div class="text-success opacity-50"><i class="bi bi-check-circle fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">In Progress</p>
                    <h3 class="mb-0 text-primary">{{ dashboard?.serviceStatusSummary?.inProgress || 0 }}</h3>
                  </div>
                  <div class="text-primary opacity-50"><i class="bi bi-gear-wide-connected fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Total Technicians</p>
                    <h3 class="mb-0">{{ dashboard?.totalTechnicians || 0 }}</h3>
                  </div>
                  <div class="text-secondary opacity-50"><i class="bi bi-people fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Left Column -->
          <div class="col-lg-8">
            <!-- Pending vs Completed Chart -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-pie-chart me-2"></i>Service Status Overview</h6>
              </div>
              <div class="card-body">
                <div class="row align-items-center">
                  <div class="col-md-6">
                    <!-- Simple Visual Chart -->
                    <div class="position-relative" style="height: 200px;">
                      <svg viewBox="0 0 200 200" class="w-100 h-100">
                        @if (totalServices > 0) {
                          <!-- Completed (Green) -->
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" stroke-width="30"/>
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#198754" stroke-width="30"
                            [attr.stroke-dasharray]="completedDash + ' ' + (502.65 - completedDash)"
                            stroke-dashoffset="125.66"
                            transform="rotate(-90 100 100)"/>
                          <!-- In Progress (Blue) -->
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#0d6efd" stroke-width="30"
                            [attr.stroke-dasharray]="inProgressDash + ' ' + (502.65 - inProgressDash)"
                            [attr.stroke-dashoffset]="125.66 - completedDash"
                            transform="rotate(-90 100 100)"/>
                          <!-- Pending (Orange) -->
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#ffc107" stroke-width="30"
                            [attr.stroke-dasharray]="pendingDash + ' ' + (502.65 - pendingDash)"
                            [attr.stroke-dashoffset]="125.66 - completedDash - inProgressDash"
                            transform="rotate(-90 100 100)"/>
                          <!-- Cancelled (Dark Red) -->
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#dc3545" stroke-width="30"
                            [attr.stroke-dasharray]="cancelledDash + ' ' + (502.65 - cancelledDash)"
                            [attr.stroke-dashoffset]="125.66 - completedDash - inProgressDash - pendingDash"
                            transform="rotate(-90 100 100)"/>
                        } @else {
                          <circle cx="100" cy="100" r="80" fill="none" stroke="#e9ecef" stroke-width="30"/>
                        }
                        <text x="100" y="95" text-anchor="middle" class="h4 fw-bold">{{ totalServices }}</text>
                        <text x="100" y="115" text-anchor="middle" class="small text-muted">Total</text>
                      </svg>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="mb-3">
                      <div class="d-flex justify-content-between mb-1">
                        <span><span class="badge bg-success me-2">&nbsp;</span>Completed</span>
                        <strong>{{ dashboard?.serviceStatusSummary?.completed || 0 }}</strong>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" [style.width.%]="completedPercent"></div>
                      </div>
                    </div>
                    <div class="mb-3">
                      <div class="d-flex justify-content-between mb-1">
                        <span><span class="badge bg-primary me-2">&nbsp;</span>In Progress</span>
                        <strong>{{ dashboard?.serviceStatusSummary?.inProgress || 0 }}</strong>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-primary" [style.width.%]="inProgressPercent"></div>
                      </div>
                    </div>
                    <div class="mb-3">
                      <div class="d-flex justify-content-between mb-1">
                        <span><span class="badge bg-warning me-2">&nbsp;</span>Pending</span>
                        <strong>{{ dashboard?.serviceStatusSummary?.pending || 0 }}</strong>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-warning" [style.width.%]="pendingPercent"></div>
                      </div>
                    </div>
                    <div>
                      <div class="d-flex justify-content-between mb-1">
                        <span><span class="badge bg-danger me-2">&nbsp;</span>Cancelled</span>
                        <strong>{{ dashboard?.serviceStatusSummary?.cancelled || 0 }}</strong>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-danger" [style.width.%]="cancelledPercent"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Technician Workload -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-people me-2"></i>Technician Workload & Performance</h6>
                <a routerLink="/app/technicians" class="btn btn-sm btn-outline-primary">Manage</a>
              </div>
              <div class="card-body p-0">
                @if (workload?.workloads?.length) {
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
                          <th class="text-end">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (tech of workload.workloads; track tech.technicianId) {
                          <tr>
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
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
                                <div class="progress flex-grow-1 me-2" style="height: 6px;">
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
                            <td class="text-end text-success fw-medium">₹{{ tech.totalRevenueGenerated | number:'1.0-0' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-people fs-1"></i>
                    <p class="mt-2">No technician data available</p>
                  </div>
                }
              </div>
            </div>

            <!-- Top Categories & Top Parts Row -->
            <div class="row g-4">
              <div class="col-md-6">
                <!-- Top Service Categories -->
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="bi bi-trophy me-2"></i>Top Categories</h6>
                    <a routerLink="/app/service-categories" class="btn btn-sm btn-outline-primary">Manage</a>
                  </div>
                  <div class="card-body p-0">
                    @if (adminDashboard?.topCategories?.length) {
                      <ul class="list-group list-group-flush">
                        @for (cat of adminDashboard.topCategories; track cat.categoryId; let i = $index) {
                          <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                              <span class="badge me-2" [ngClass]="i === 0 ? 'bg-warning text-dark' : 'bg-light text-dark'">{{ i + 1 }}</span>
                              <span class="fw-medium">{{ cat.categoryName }}</span>
                            </div>
                            <div class="text-end">
                              <span class="badge bg-primary">{{ cat.serviceCount }}</span>
                              <small class="d-block text-success">₹{{ cat.revenue | number:'1.0-0' }}</small>
                            </div>
                          </li>
                        }
                      </ul>
                    } @else {
                      <div class="text-center py-4 text-muted">
                        <i class="bi bi-grid fs-1"></i>
                        <p class="mt-2 mb-0">No category data</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <!-- Top Parts Used -->
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="bi bi-tools me-2"></i>Top Parts Used</h6>
                    <a routerLink="/app/parts" class="btn btn-sm btn-outline-primary">View All</a>
                  </div>
                  <div class="card-body p-0">
                    @if (adminDashboard?.topParts?.length) {
                      <ul class="list-group list-group-flush">
                        @for (part of adminDashboard.topParts; track part.partId; let i = $index) {
                          <li class="list-group-item d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                              <span class="badge me-2" [ngClass]="i === 0 ? 'bg-warning text-dark' : 'bg-light text-dark'">{{ i + 1 }}</span>
                              <div>
                                <div class="fw-medium">{{ part.partName }}</div>
                                <small class="text-muted">{{ part.partNumber }}</small>
                              </div>
                            </div>
                            <div class="text-end">
                              <span class="badge bg-info">{{ part.totalUsed }}</span>
                              <small class="d-block text-success">₹{{ part.revenue | number:'1.0-0' }}</small>
                            </div>
                          </li>
                        }
                      </ul>
                    } @else {
                      <div class="text-center py-4 text-muted">
                        <i class="bi bi-box-seam fs-1"></i>
                        <p class="mt-2 mb-0">No parts usage data</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="col-lg-4">
            <!-- Low Stock Alert -->
            <div class="card border-0 shadow-sm mb-4 border-danger" [class.border-2]="adminDashboard?.lowStockParts?.length">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Low Stock Alert</h6>
                <a routerLink="/app/parts" class="btn btn-sm btn-outline-danger">Manage</a>
              </div>
              <div class="card-body p-0">
                @if (adminDashboard?.lowStockParts?.length) {
                  <ul class="list-group list-group-flush">
                    @for (part of adminDashboard.lowStockParts; track part.partId) {
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <div class="fw-medium">{{ part.partName }}</div>
                          <small class="text-muted">{{ part.partNumber }}</small>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-danger">{{ part.currentStock }} left</span>
                          <small class="d-block text-muted">Min: {{ part.minimumStock }}</small>
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle fs-1 text-success"></i>
                    <p class="mt-2 mb-0">All parts well stocked</p>
                  </div>
                }
              </div>
            </div>

            <!-- Vehicle Service History Lookup -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-car-front me-2"></i>Vehicle Service History</h6>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <select class="form-select" [(ngModel)]="selectedVehicleId" (change)="loadVehicleHistory()">
                    <option [ngValue]="null">Select a vehicle...</option>
                    @for (v of vehicles; track v.vehicleId) {
                      <option [ngValue]="v.vehicleId">{{ v.registrationNumber }} - {{ v.make }} {{ v.model }}</option>
                    }
                  </select>
                </div>

                @if (vehicleHistoryLoading) {
                  <div class="text-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                }

                @if (!vehicleHistoryLoading && vehicleHistory) {
                  <div class="border rounded p-3 mb-3">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted small">Owner</span>
                      <span class="fw-medium">{{ vehicleHistory.customerName }}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted small">Total Services</span>
                      <span class="badge bg-primary">{{ vehicleHistory.totalServices }}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                      <span class="text-muted small">Total Spent</span>
                      <span class="text-success fw-bold">₹{{ vehicleHistory.totalAmountSpent | number:'1.0-0' }}</span>
                    </div>
                  </div>

                  @if (vehicleHistory.serviceHistory?.length) {
                    <div class="small">
                      <strong class="d-block mb-2">Service History</strong>
                      @for (s of vehicleHistory.serviceHistory.slice(0, 5); track s.serviceRequestId) {
                        <div class="border-start border-3 ps-2 mb-2" 
                          [class.border-success]="s.status === 'Completed'"
                          [class.border-primary]="s.status === 'InProgress'"
                          [class.border-warning]="s.status === 'Requested' || s.status === 'Assigned'">
                          <div class="d-flex justify-content-between">
                            <span>{{ s.categoryName }}</span>
                            <span class="text-muted">₹{{ s.cost | number:'1.0-0' }}</span>
                          </div>
                          <small class="text-muted">{{ s.requestedDate | date:'mediumDate' }}</small>
                        </div>
                      }
                    </div>
                  }
                }

                @if (!vehicleHistoryLoading && selectedVehicleId && !vehicleHistory) {
                  <div class="text-center text-muted py-3">
                    <i class="bi bi-inbox fs-4"></i>
                    <p class="small mb-0">No service history found</p>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-lightning me-2"></i>Quick Stats</h6>
              </div>
              <div class="card-body">
                <div class="row g-2 text-center">
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <i class="bi bi-people text-primary fs-4"></i>
                      <h5 class="mb-0 mt-2">{{ dashboard?.totalCustomers || 0 }}</h5>
                      <small class="text-muted">Customers</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <i class="bi bi-truck text-primary fs-4"></i>
                      <h5 class="mb-0 mt-2">{{ dashboard?.totalVehicles || 0 }}</h5>
                      <small class="text-muted">Vehicles</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3">
                      <i class="bi bi-person-gear text-primary fs-4"></i>
                      <h5 class="mb-0 mt-2">{{ dashboard?.totalTechnicians || 0 }}</h5>
                      <small class="text-muted">Technicians</small>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="border rounded p-3" [class.border-danger]="(dashboard?.lowStockPartsCount || 0) > 0">
                      <i class="bi bi-box-seam fs-4" [class.text-danger]="(dashboard?.lowStockPartsCount || 0) > 0" [class.text-primary]="(dashboard?.lowStockPartsCount || 0) === 0"></i>
                      <h5 class="mb-0 mt-2" [class.text-danger]="(dashboard?.lowStockPartsCount || 0) > 0">{{ dashboard?.lowStockPartsCount || 0 }}</h5>
                      <small class="text-muted">Low Stock</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Technician Dashboard -->
      @if (!loading && isTechnician) {
        <!-- Summary Cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-warning">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Assigned</p>
                    <h3 class="mb-0 text-warning">{{ techAssignedCount }}</h3>
                  </div>
                  <div class="text-warning opacity-50"><i class="bi bi-clipboard-check fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-primary">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">In Progress</p>
                    <h3 class="mb-0 text-primary">{{ techInProgressCount }}</h3>
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
                    <p class="text-muted mb-1 small">Completed</p>
                    <h3 class="mb-0 text-success">{{ techCompletedCount }}</h3>
                  </div>
                  <div class="text-success opacity-50"><i class="bi bi-check-circle fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-6 col-lg-3">
            <div class="card border-0 shadow-sm h-100 border-start border-4 border-info">
              <div class="card-body">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="text-muted mb-1 small">Total Tasks</p>
                    <h3 class="mb-0 text-info">{{ myAssignments.length }}</h3>
                  </div>
                  <div class="text-info opacity-50"><i class="bi bi-list-task fs-2"></i></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Left Column - Charts -->
          <div class="col-lg-4">
            <!-- Work Progress Chart -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-pie-chart me-2"></i>My Work Progress</h6>
              </div>
              <div class="card-body">
                <div class="position-relative" style="height: 180px;">
                  <svg viewBox="0 0 200 200" class="w-100 h-100">
                    @if (myAssignments.length > 0) {
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#e9ecef" stroke-width="25"/>
                      <!-- Completed (Green) -->
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#198754" stroke-width="25"
                        [attr.stroke-dasharray]="techCompletedDash + ' ' + (439.82 - techCompletedDash)"
                        stroke-dashoffset="109.96"
                        transform="rotate(-90 100 100)"/>
                      <!-- In Progress (Blue) -->
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#0d6efd" stroke-width="25"
                        [attr.stroke-dasharray]="techInProgressDash + ' ' + (439.82 - techInProgressDash)"
                        [attr.stroke-dashoffset]="109.96 - techCompletedDash"
                        transform="rotate(-90 100 100)"/>
                      <!-- Assigned (Orange) -->
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#ffc107" stroke-width="25"
                        [attr.stroke-dasharray]="techAssignedDash + ' ' + (439.82 - techAssignedDash)"
                        [attr.stroke-dashoffset]="109.96 - techCompletedDash - techInProgressDash"
                        transform="rotate(-90 100 100)"/>
                    } @else {
                      <circle cx="100" cy="100" r="70" fill="none" stroke="#e9ecef" stroke-width="25"/>
                    }
                    <text x="100" y="95" text-anchor="middle" class="h5 fw-bold">{{ myAssignments.length }}</text>
                    <text x="100" y="115" text-anchor="middle" class="small text-muted">Tasks</text>
                  </svg>
                </div>
                <div class="mt-3">
                  <div class="d-flex justify-content-between mb-2">
                    <span><span class="badge bg-warning me-2">&nbsp;</span>Assigned</span>
                    <strong>{{ techAssignedCount }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span><span class="badge bg-primary me-2">&nbsp;</span>In Progress</span>
                    <strong>{{ techInProgressCount }}</strong>
                  </div>
                  <div class="d-flex justify-content-between">
                    <span><span class="badge bg-success me-2">&nbsp;</span>Completed</span>
                    <strong>{{ techCompletedCount }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Weekly Performance -->
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white py-3">
                <h6 class="mb-0"><i class="bi bi-calendar-week me-2"></i>This Week</h6>
              </div>
              <div class="card-body">
                <div class="text-center py-3">
                  <div class="display-4 text-success fw-bold">{{ techCompletedThisWeek }}</div>
                  <p class="text-muted mb-0">Tasks Completed</p>
                </div>
                <hr>
                <div class="row text-center">
                  <div class="col-6">
                    <h5 class="text-primary mb-0">{{ techActiveCount }}</h5>
                    <small class="text-muted">Active Now</small>
                  </div>
                  <div class="col-6">
                    <h5 class="text-warning mb-0">{{ urgentTasksCount }}</h5>
                    <small class="text-muted">Urgent</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Task Management -->
          <div class="col-lg-8">
            <!-- Active Tasks -->
            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-list-task me-2"></i>My Active Tasks</h6>
                <div>
                  <select class="form-select form-select-sm" [(ngModel)]="techStatusFilter" (change)="filterAssignments()" style="width: auto;">
                    <option value="all">All Tasks</option>
                    <option value="Assigned">Assigned</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div class="card-body p-0">
                @if (filteredAssignments.length === 0) {
                  <div class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    <p>No tasks found</p>
                  </div>
                } @else {
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Vehicle</th>
                          <th>Customer</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (task of filteredAssignments; track task.assignmentId) {
                          <tr [class.table-warning]="task.priority === 'Urgent'">
                            <td>
                              <div class="fw-medium">{{ task.vehicleInfo }}</div>
                              <small class="text-muted">{{ task.serviceDescription }}</small>
                            </td>
                            <td>{{ task.customerName }}</td>
                            <td>
                              <span class="badge" [ngClass]="{
                                'bg-danger': task.priority === 'Urgent',
                                'bg-warning text-dark': task.priority === 'High',
                                'bg-info': task.priority === 'Normal',
                                'bg-secondary': task.priority === 'Low'
                              }">{{ task.priority }}</span>
                            </td>
                            <td>
                              <span class="badge" [ngClass]="{
                                'bg-warning text-dark': task.status === 'Assigned',
                                'bg-primary': task.status === 'InProgress',
                                'bg-success': task.status === 'Completed'
                              }">{{ task.status === 'InProgress' ? 'In Progress' : task.status }}</span>
                            </td>
                            <td>
                              @if (task.status === 'Assigned') {
                                <button class="btn btn-sm btn-primary" (click)="startTask(task)" [disabled]="updatingTaskId === task.assignmentId">
                                  @if (updatingTaskId === task.assignmentId) {
                                    <span class="spinner-border spinner-border-sm"></span>
                                  } @else {
                                    <i class="bi bi-play-fill"></i> Start
                                  }
                                </button>
                              } @else if (task.status === 'InProgress') {
                                <button class="btn btn-sm btn-success" (click)="openCompleteModal(task)" [disabled]="updatingTaskId === task.assignmentId">
                                  <i class="bi bi-check-lg"></i> Complete
                                </button>
                              } @else {
                                <span class="text-success"><i class="bi bi-check-circle-fill"></i></span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </div>

            <!-- Task Details / Complete Task Modal -->
            @if (selectedTask) {
              <div class="card border-0 shadow-sm border-primary">
                <div class="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                  <h6 class="mb-0"><i class="bi bi-clipboard-data me-2"></i>Complete Task</h6>
                  <button class="btn btn-sm btn-outline-light" (click)="selectedTask = null">
                    <i class="bi bi-x-lg"></i>
                  </button>
                </div>
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label text-muted small">Vehicle</label>
                      <p class="fw-medium mb-0">{{ selectedTask.vehicleInfo }}</p>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label text-muted small">Customer</label>
                      <p class="fw-medium mb-0">{{ selectedTask.customerName }}</p>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label class="form-label text-muted small">Service</label>
                      <p class="fw-medium mb-0">{{ selectedTask.serviceDescription || 'Custom Issue' }}</p>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label text-muted small">Started</label>
                      <p class="fw-medium mb-0">{{ selectedTask.startedDate | date:'medium' }}</p>
                    </div>
                  </div>
                  
                  <!-- Task Checklist -->
                  @if (selectedTask.tasks && selectedTask.tasks.length > 0) {
                    <div class="mb-3">
                      <label class="form-label d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-list-check me-2"></i>Work Items</span>
                        <span class="badge bg-primary">{{ getCompletedTaskCount(selectedTask) }}/{{ selectedTask.tasks.length }}</span>
                      </label>
                      <div class="list-group">
                        @for (task of selectedTask.tasks; track task.serviceTaskId) {
                          <div class="list-group-item d-flex align-items-center gap-3" 
                               [class.list-group-item-success]="task.isCompleted">
                            <div class="form-check">
                              <input 
                                class="form-check-input" 
                                type="checkbox" 
                                [id]="'task-' + task.serviceTaskId"
                                [checked]="task.isCompleted"
                                (change)="toggleTaskCompletion(task)"
                                [disabled]="togglingTaskId === task.serviceTaskId">
                            </div>
                            <div class="flex-grow-1">
                              <span [class.text-decoration-line-through]="task.isCompleted"
                                    [class.text-muted]="task.isCompleted">
                                {{ task.description }}
                              </span>
                              @if (task.isCompleted && task.completedDate) {
                                <small class="d-block text-success">
                                  <i class="bi bi-check-circle-fill me-1"></i>
                                  Completed {{ task.completedDate | date:'short' }}
                                </small>
                              }
                            </div>
                            @if (togglingTaskId === task.serviceTaskId) {
                              <span class="spinner-border spinner-border-sm text-primary"></span>
                            }
                          </div>
                        }
                      </div>
                      @if (getCompletedTaskCount(selectedTask) < selectedTask.tasks.length) {
                        <small class="text-warning mt-2 d-block">
                          <i class="bi bi-exclamation-triangle me-1"></i>Complete all tasks to finish this assignment
                        </small>
                      }
                    </div>
                  } @else if (selectedTask.issueDescription) {
                    <!-- Fallback for requests without parsed tasks -->
                    <div class="mb-3 p-3 rounded" [class.bg-warning-subtle]="!selectedTask.serviceDescription" [class.bg-light]="selectedTask.serviceDescription">
                      <label class="form-label text-muted small">
                        @if (!selectedTask.serviceDescription) {
                          <i class="bi bi-exclamation-triangle text-warning me-1"></i>Customer's Issue Description (Custom Request)
                        } @else {
                          Issue Description
                        }
                      </label>
                      <p class="mb-0" [class.fw-medium]="!selectedTask.serviceDescription">{{ selectedTask.issueDescription }}</p>
                    </div>
                  }
                  
                  <div class="mb-3">
                    <label class="form-label">Technician Remarks <span class="text-danger">*</span></label>
                    <textarea 
                      class="form-control" 
                      rows="3" 
                      [(ngModel)]="completionNotes"
                      placeholder="Describe the work completed, parts replaced, issues found, etc."
                      required></textarea>
                    <small class="text-muted">Provide detailed notes about the service performed</small>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-success" (click)="completeTask()" 
                            [disabled]="!completionNotes.trim() || updatingTaskId === selectedTask.assignmentId || !canCompleteAssignment(selectedTask)">
                      @if (updatingTaskId === selectedTask.assignmentId) {
                        <span class="spinner-border spinner-border-sm me-2"></span>Completing...
                      } @else {
                        <i class="bi bi-check-circle me-2"></i>Mark as Completed
                      }
                    </button>
                    <button class="btn btn-outline-secondary" (click)="selectedTask = null">Cancel</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Customer Dashboard -->
      @if (!loading && isCustomer) {
        <div class="row g-3">
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center py-4 h-100">
              <i class="bi bi-truck fs-1 text-primary"></i>
              <p class="text-muted mt-2 mb-3">Manage your vehicles</p>
              <a routerLink="/app/my-vehicles" class="btn btn-outline-primary">My Vehicles</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center py-4 h-100">
              <i class="bi bi-plus-circle fs-1 text-success"></i>
              <p class="text-muted mt-2 mb-3">Book a new service</p>
              <a routerLink="/app/book-service" class="btn btn-success">Book Service</a>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card border-0 shadow-sm text-center py-4 h-100">
              <i class="bi bi-clipboard-check fs-1 text-info"></i>
              <p class="text-muted mt-2 mb-3">Track your requests</p>
              <a routerLink="/app/track-service" class="btn btn-outline-info">Track Service</a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .progress { background-color: #f8f9fa; }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);

  loading = true;
  today = new Date();
  dashboard: DashboardReport | null = null;
  workload: TechnicianWorkloadReport | null = null;
  adminDashboard: AdminDashboard | null = null;
  vehicles: Vehicle[] = [];
  selectedVehicleId: number | null = null;
  vehicleHistory: VehicleServiceHistory | null = null;
  vehicleHistoryLoading = false;
  myAssignments: any[] = [];
  filteredAssignments: any[] = [];
  techStatusFilter = 'all';
  selectedTask: any = null;
  completionNotes = '';
  updatingTaskId: number | null = null;
  togglingTaskId: number | null = null;
  customerGrievances: CustomerGrievance[] = [];
  technicianRemarks: TechnicianRemark[] = [];

  get isAdmin() { return this.authService.isAdmin(); }
  get isManager() { return this.authService.isManager(); }
  get isTechnician() { return this.authService.isTechnician(); }
  get isCustomer() { return this.authService.isCustomer(); }
  get techAssignedCount(): number {
    return this.myAssignments.filter(a => a.status === 'Assigned').length;
  }
  get techInProgressCount(): number {
    return this.myAssignments.filter(a => a.status === 'InProgress').length;
  }
  get techCompletedCount(): number {
    return this.myAssignments.filter(a => a.status === 'Completed').length;
  }
  get techActiveCount(): number {
    return this.techAssignedCount + this.techInProgressCount;
  }
  get urgentTasksCount(): number {
    return this.myAssignments.filter(a => a.priority === 'Urgent' && a.status !== 'Completed').length;
  }
  get techCompletedThisWeek(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.myAssignments.filter(a =>
      a.status === 'Completed' &&
      a.completedDate &&
      new Date(a.completedDate) >= weekAgo
    ).length;
  }
  get techCompletedPercent(): number {
    return this.myAssignments.length > 0 ? (this.techCompletedCount / this.myAssignments.length) * 100 : 0;
  }
  get techInProgressPercent(): number {
    return this.myAssignments.length > 0 ? (this.techInProgressCount / this.myAssignments.length) * 100 : 0;
  }
  get techAssignedPercent(): number {
    return this.myAssignments.length > 0 ? (this.techAssignedCount / this.myAssignments.length) * 100 : 0;
  }
  get techCompletedDash(): number { return (this.techCompletedPercent / 100) * 439.82; }
  get techInProgressDash(): number { return (this.techInProgressPercent / 100) * 439.82; }
  get techAssignedDash(): number { return (this.techAssignedPercent / 100) * 439.82; }
  get unresolvedGrievancesCount(): number {
    return this.customerGrievances.filter(g => g.status === 'Unresolved').length;
  }
  get highPriorityGrievances(): CustomerGrievance[] {
    return this.customerGrievances.filter(g => g.priority === 'High' && g.status !== 'Resolved');
  }

  get totalServices(): number {
    const s = this.dashboard?.serviceStatusSummary;
    return (s?.pending || 0) + (s?.inProgress || 0) + (s?.completed || 0) + (s?.cancelled || 0);
  }

  get completedPercent(): number {
    return this.totalServices > 0 ? ((this.dashboard?.serviceStatusSummary?.completed || 0) / this.totalServices) * 100 : 0;
  }
  get inProgressPercent(): number {
    return this.totalServices > 0 ? ((this.dashboard?.serviceStatusSummary?.inProgress || 0) / this.totalServices) * 100 : 0;
  }
  get pendingPercent(): number {
    return this.totalServices > 0 ? ((this.dashboard?.serviceStatusSummary?.pending || 0) / this.totalServices) * 100 : 0;
  }
  get cancelledPercent(): number {
    return this.totalServices > 0 ? ((this.dashboard?.serviceStatusSummary?.cancelled || 0) / this.totalServices) * 100 : 0;
  }
  get completedDash(): number { return (this.completedPercent / 100) * 502.65; }
  get inProgressDash(): number { return (this.inProgressPercent / 100) * 502.65; }
  get pendingDash(): number { return (this.pendingPercent / 100) * 502.65; }
  get cancelledDash(): number { return (this.cancelledPercent / 100) * 502.65; }

  ngOnInit() {
    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isManager) {
      this.loadManagerDashboard();
    } else if (this.isTechnician) {
      this.loadTechnicianDashboard();
    } else {
      this.loading = false;
    }
  }

  loadAdminDashboard() {
    this.api.get<AdminDashboard>('/dashboard/admin').subscribe({
      next: (res) => {
        this.adminDashboard = res.success ? res.data : null;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadManagerDashboard() {
    forkJoin({
      dashboard: this.api.get<DashboardReport>('/reports/dashboard'),
      workload: this.api.get<TechnicianWorkloadReport>('/reports/technician-workload'),
      vehicles: this.api.get<Vehicle[]>('/vehicles'),
      adminDashboard: this.api.get<AdminDashboard>('/dashboard/admin')
    }).subscribe({
      next: (res) => {
        this.dashboard = res.dashboard.success ? res.dashboard.data : null;
        this.workload = res.workload.success ? res.workload.data : null;
        this.vehicles = res.vehicles.success ? res.vehicles.data : [];
        this.adminDashboard = res.adminDashboard.success ? res.adminDashboard.data : null;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadTechnicianDashboard() {
    this.api.get<any[]>('/serviceassignments').subscribe({
      next: (res) => {
        this.myAssignments = res.success ? res.data : [];
        this.filterAssignments();
        this.loading = false;
      },
      error: () => {
        this.myAssignments = [];
        this.loading = false;
      }
    });
  }

  filterAssignments() {
    if (this.techStatusFilter === 'all') {
      this.filteredAssignments = [...this.myAssignments];
    } else {
      this.filteredAssignments = this.myAssignments.filter(a => a.status === this.techStatusFilter);
    }
    this.filteredAssignments.sort((a, b) => {
      if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
      if (b.priority === 'Urgent' && a.priority !== 'Urgent') return 1;
      const statusOrder: Record<string, number> = { 'Assigned': 0, 'InProgress': 1, 'Completed': 2 };
      return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
    });
  }

  startTask(task: any) {
    this.updatingTaskId = task.assignmentId;
    this.api.put<any>(`/serviceassignments/${task.assignmentId}/status`, {
      status: 'InProgress',
      notes: 'Started work on this service'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          task.status = 'InProgress';
          task.startedDate = new Date().toISOString();
          this.filterAssignments();
        }
        this.updatingTaskId = null;
      },
      error: () => this.updatingTaskId = null
    });
  }

  openCompleteModal(task: any) {
    this.selectedTask = task;
    this.completionNotes = task.notes || '';
  }

  completeTask() {
    if (!this.selectedTask || !this.completionNotes.trim()) return;

    this.updatingTaskId = this.selectedTask.assignmentId;
    this.api.put<any>(`/serviceassignments/${this.selectedTask.assignmentId}/status`, {
      status: 'Completed',
      notes: this.completionNotes.trim()
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedTask.status = 'Completed';
          this.selectedTask.completedDate = new Date().toISOString();
          this.selectedTask.notes = this.completionNotes.trim();
          this.filterAssignments();
        }
        this.updatingTaskId = null;
        this.selectedTask = null;
        this.completionNotes = '';
      },
      error: () => this.updatingTaskId = null
    });
  }

  loadVehicleHistory() {
    if (!this.selectedVehicleId) {
      this.vehicleHistory = null;
      return;
    }

    this.vehicleHistoryLoading = true;
    this.api.get<VehicleServiceHistory>(`/reports/vehicle-history/${this.selectedVehicleId}`).subscribe({
      next: res => {
        this.vehicleHistory = res.success ? res.data : null;
        this.vehicleHistoryLoading = false;
      },
      error: () => {
        this.vehicleHistory = null;
        this.vehicleHistoryLoading = false;
      }
    });
  }
  getCompletedTaskCount(assignment: any): number {
    if (!assignment.tasks || assignment.tasks.length === 0) return 0;
    return assignment.tasks.filter((t: any) => t.isCompleted).length;
  }

  canCompleteAssignment(assignment: any): boolean {
    if (!assignment.tasks || assignment.tasks.length === 0) return true;
    return assignment.tasks.every((t: any) => t.isCompleted);
  }

  toggleTaskCompletion(task: any) {
    this.togglingTaskId = task.serviceTaskId;
    this.api.put<any>(`/servicetasks/${task.serviceTaskId}/toggle`, {}).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          task.isCompleted = res.data.isCompleted;
          task.completedDate = res.data.completedDate;
          task.completedByUserId = res.data.completedByUserId;
          task.completedByName = res.data.completedByName;
        }
        this.togglingTaskId = null;
      },
      error: () => {
        this.togglingTaskId = null;
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'bg-danger';
      case 'ServiceManager': return 'bg-primary';
      case 'Technician': return 'bg-info';
      case 'Customer': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}
