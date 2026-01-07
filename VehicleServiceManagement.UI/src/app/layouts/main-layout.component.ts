import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NotificationBellComponent } from '../components/notification-bell.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NotificationBellComponent],
  template: `
    <div class="d-flex">
      <!-- Sidebar -->
      <nav class="sidebar bg-dark text-white" [class.collapsed]="isCollapsed">
        <div class="p-3 border-bottom border-secondary text-center">
          <a routerLink="/app/dashboard" class="text-decoration-none">
            <img src="logo.png" alt="CVMS Logo" class="sidebar-logo" [class.small]="isCollapsed">
          </a>
        </div>
        
        <!-- Main Navigation -->
        <ul class="nav flex-column p-2 flex-grow-1">
          @for (item of filteredNavItems; track item.route) {
            <li class="nav-item">
              <a class="nav-link text-white-50" [routerLink]="item.route" routerLinkActive="active bg-primary text-white rounded">
                <i class="bi" [ngClass]="item.icon"></i>
                <span class="ms-2" *ngIf="!isCollapsed">{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>

        <!-- Bottom Section: Profile & Collapse -->
        <div class="mt-auto border-top border-secondary">
          <!-- Profile Link -->
          <a routerLink="/app/profile" routerLinkActive="active bg-primary" class="d-flex align-items-center p-3 text-white-50 text-decoration-none profile-link">
            <i class="bi bi-person-circle fs-5"></i>
            <div class="ms-2" *ngIf="!isCollapsed">
              <div class="small fw-medium text-white">{{ user?.firstName }} {{ user?.lastName }}</div>
              <div class="small opacity-75">View Profile</div>
            </div>
          </a>
          
          <!-- Collapse Toggle -->
          <div class="p-2 border-top border-secondary">
            <button class="btn btn-sm btn-outline-light w-100" (click)="toggleSidebar($event)">
              <i class="bi" [ngClass]="isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'"></i>
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <div class="main-content flex-grow-1">
        <!-- Header -->
        <header class="bg-dark border-bottom px-4 py-2 d-flex justify-content-between align-items-center header-fixed">
          <h6 class="mb-0 text-white-50">Chubb Vehicle Management System</h6>
          <div class="d-flex align-items-center gap-3">
            <!-- Notification Bell -->
            <app-notification-bell></app-notification-bell>
            @if (user) {
              <span class="fw-medium text-white">{{ user.firstName }} {{ user.lastName }}</span>
              <span class="badge" [ngClass]="getRoleBadge()">{{ getRoleDisplay() }}</span>
            }
            <button class="btn btn-outline-light btn-sm" (click)="logout()">
              <i class="bi bi-box-arrow-right me-1"></i>Logout
            </button>
          </div>
        </header>
        <!-- Content -->
        <main class="p-4 bg-light main-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      transition: width 0.3s;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      overflow-y: auto;
    }
    .sidebar.collapsed { width: 70px; }
    .sidebar-logo { max-width: 160px; height: auto; transition: all 0.3s; }
    .sidebar-logo.small { max-width: 40px; }
    .nav-link { padding: 0.75rem 1rem; transition: all 0.2s; }
    .nav-link:hover { background: rgba(255,255,255,0.1); border-radius: 0.25rem; }
    .nav-link.active { background: var(--bs-primary) !important; }
    .profile-link { transition: background 0.2s; }
    .profile-link:hover { background: rgba(255,255,255,0.1); }
    .profile-link.active { background: var(--bs-primary); }
    .main-content {
      margin-left: 220px;
      transition: margin-left 0.3s;
    }
    .sidebar.collapsed + .main-content {
      margin-left: 70px;
    }
    .header-fixed {
      height: 56px;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .main-area {
      min-height: calc(100vh - 56px);
    }
  `]
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  isCollapsed = false;

  navItems = [
    { label: 'Dashboard', icon: 'bi-speedometer2', route: '/app/dashboard', roles: ['Admin', 'ServiceManager', 'Technician', 'Customer'] },
    { label: 'My Vehicles', icon: 'bi-car-front', route: '/app/my-vehicles', roles: ['Customer'] },
    { label: 'Book Service', icon: 'bi-calendar-plus', route: '/app/book-service', roles: ['Customer'] },
    { label: 'Track Service', icon: 'bi-geo-alt', route: '/app/track-service', roles: ['Customer'] },
    { label: 'Service History', icon: 'bi-clock-history', route: '/app/service-history', roles: ['Customer'] },
    { label: 'My Bills', icon: 'bi-receipt', route: '/app/bills', roles: ['Customer'] },
    { label: 'Users', icon: 'bi-people', route: '/app/users', roles: ['Admin'] },
    { label: 'Vehicles', icon: 'bi-truck', route: '/app/vehicles', roles: ['ServiceManager'] },
    { label: 'Categories', icon: 'bi-tags', route: '/app/categories', roles: ['Admin', 'ServiceManager'] },
    { label: 'Service Requests', icon: 'bi-clipboard-check', route: '/app/service-requests', roles: ['ServiceManager', 'Technician'] },
    { label: 'Assignments', icon: 'bi-person-workspace', route: '/app/assignments', roles: ['ServiceManager', 'Technician'] },
    { label: 'Technicians', icon: 'bi-people-fill', route: '/app/technicians', roles: ['ServiceManager'] },
    { label: 'Parts', icon: 'bi-box-seam', route: '/app/parts', roles: ['Admin', 'ServiceManager', 'Technician'] },
    { label: 'Part Orders', icon: 'bi-cart3', route: '/app/part-orders', roles: ['ServiceManager'] },
    { label: 'Bills', icon: 'bi-receipt', route: '/app/bills', roles: ['ServiceManager'] },
    { label: 'Reports', icon: 'bi-bar-chart-line', route: '/app/reports', roles: ['ServiceManager'] }
  ];

  get user() { return this.authService.currentUser; }
  get filteredNavItems() {
    const role = this.authService.userRole;
    return role ? this.navItems.filter(i => i.roles.includes(role)) : [];
  }

  getRoleBadge(): string {
    switch (this.user?.role) {
      case 'Admin': return 'bg-danger';
      case 'ServiceManager': return 'bg-primary';
      case 'Technician': return 'bg-success';
      default: return 'bg-info';
    }
  }

  getRoleDisplay(): string {
    switch (this.user?.role) {
      case 'ServiceManager': return 'Service Manager';
      default: return this.user?.role || '';
    }
  }

  toggleSidebar(event: Event) {
    event.stopPropagation();
    this.isCollapsed = !this.isCollapsed;
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (mainContent) {
      mainContent.style.marginLeft = this.isCollapsed ? '70px' : '220px';
    }
  }

  logout() { this.authService.logout(); }
}

