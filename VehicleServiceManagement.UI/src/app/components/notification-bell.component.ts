import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, InAppNotification } from '../core/notification.service';
import { AuthService } from '../core/auth.service';


@Component({
    selector: 'app-notification-bell',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="notification-bell" (click)="toggleDropdown($event)">
            <button class="btn btn-link position-relative p-0" type="button">
                <i class="bi bi-bell text-white" style="font-size: 1.25rem;"></i>
                @if (unreadCount > 0) {
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {{ unreadCount > 99 ? '99+' : unreadCount }}
                    </span>
                }
            </button>
            
            @if (isOpen) {
                <div class="notification-dropdown" (click)="$event.stopPropagation()">
                    <div class="notification-header">
                        <h6 class="mb-0">Notifications</h6>
                        @if (unreadCount > 0) {
                            <button class="btn btn-link btn-sm p-0" (click)="markAllRead()">
                                Mark all as read
                            </button>
                        }
                    </div>
                    
                    <div class="notification-body">
                        @if (loading) {
                            <div class="notification-loading">
                                @for (i of [1,2,3]; track i) {
                                    <div class="notification-skeleton">
                                        <div class="skeleton-icon"></div>
                                        <div class="skeleton-content">
                                            <div class="skeleton-title"></div>
                                            <div class="skeleton-message"></div>
                                        </div>
                                    </div>
                                }
                            </div>
                        } @else if (notifications.length === 0) {
                            <div class="notification-empty">
                                <i class="bi bi-bell-slash text-muted" style="font-size: 2.5rem;"></i>
                                <p class="text-muted mt-2 mb-0">No notifications yet</p>
                            </div>
                        } @else {
                            <div class="notification-list">
                                @for (notification of notifications; track notification.id) {
                                    <div 
                                        class="notification-item" 
                                        [class.unread]="!notification.isRead"
                                        (click)="onNotificationClick(notification)">
                                        <div class="notification-icon" [style.background-color]="getTypeColor(notification.type)">
                                            <i [class]="'bi ' + notification.typeIcon"></i>
                                        </div>
                                        <div class="notification-content">
                                            <div class="notification-title">{{ notification.title }}</div>
                                            <div class="notification-message">{{ notification.message }}</div>
                                            <div class="notification-time">{{ notification.timeAgo }}</div>
                                        </div>
                                        @if (!notification.isRead) {
                                            <div class="unread-dot"></div>
                                        }
                                    </div>
                                }
                            </div>
                        }
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .notification-bell {
            position: relative;
            display: inline-block;
        }
        
        .notification-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            width: 360px;
            max-height: 480px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15);
            z-index: 1050;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
        }
        
        .notification-body {
            max-height: 350px;
            overflow-y: auto;
        }
        
        .notification-list {
            padding: 0;
        }
        
        .notification-item {
            display: flex;
            align-items: flex-start;
            padding: 12px 16px;
            cursor: pointer;
            transition: background-color 0.15s;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
        }
        
        .notification-item:hover {
            background-color: #f8f9fa;
        }
        
        .notification-item.unread {
            background-color: #e8f4fd;
        }
        
        .notification-item.unread:hover {
            background-color: #d4ecfb;
        }
        
        .notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
            margin-right: 12px;
        }
        
        .notification-content {
            flex: 1;
            min-width: 0;
        }
        
        .notification-title {
            font-weight: 600;
            font-size: 0.875rem;
            color: #333;
            margin-bottom: 2px;
        }
        
        .notification-message {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }
        
        .notification-time {
            font-size: 0.7rem;
            color: #999;
            margin-top: 4px;
        }
        
        .unread-dot {
            width: 8px;
            height: 8px;
            background: #0d6efd;
            border-radius: 50%;
            flex-shrink: 0;
            margin-left: 8px;
            margin-top: 6px;
        }
        
        .notification-empty {
            padding: 40px;
            text-align: center;
        }
        
        .notification-footer {
            padding: 12px;
            text-align: center;
            border-top: 1px solid #eee;
            background: #f8f9fa;
        }
        
        /* Loading skeleton */
        .notification-skeleton {
            display: flex;
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .skeleton-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            margin-right: 12px;
        }
        
        .skeleton-content {
            flex: 1;
        }
        
        .skeleton-title {
            width: 60%;
            height: 14px;
            border-radius: 4px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            margin-bottom: 8px;
        }
        
        .skeleton-message {
            width: 90%;
            height: 12px;
            border-radius: 4px;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        @media (max-width: 576px) {
            .notification-dropdown {
                width: 100vw;
                right: -100px;
                border-radius: 0;
            }
        }
    `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
    notifications: InAppNotification[] = [];
    unreadCount = 0;
    isOpen = false;
    loading = false;

    private pollingSubscription?: Subscription;
    private unreadSubscription?: Subscription;

    constructor(
        private notificationService: NotificationService,
        private authService: AuthService,
        private router: Router,
        private elementRef: ElementRef
    ) { }

    ngOnInit() {
        if (this.authService.isAuthenticated) {
            this.unreadSubscription = this.notificationService.unreadCount$.subscribe(count => {
                this.unreadCount = count;
            });
            this.pollingSubscription = this.notificationService.startPolling().subscribe();
        }
    }

    ngOnDestroy() {
        this.pollingSubscription?.unsubscribe();
        this.unreadSubscription?.unsubscribe();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }

    toggleDropdown(event: Event) {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.loadNotifications();
        }
    }

    close() {
        this.isOpen = false;
    }

    loadNotifications() {
        this.loading = true;
        this.notificationService.getNotifications(0, 10).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.notifications = res.data.notifications;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
        });
    }

    onNotificationClick(notification: InAppNotification) {
        if (!notification.isRead) {
            this.notificationService.markAsRead(notification.id).subscribe();
            notification.isRead = true;
            this.notificationService.decrementUnreadCount();
        }
        
        this.close();
        
        if (notification.actionUrl) {
            const userRole = this.authService.currentUser?.role;
            const url = notification.actionUrl;
            
            if (!userRole) {
                this.router.navigate(['/app/dashboard']);
                return;
            }
            
            const roleRestrictedRoutes = [
                { path: '/app/users', roles: ['Admin'] },
                { path: '/app/service-requests', roles: ['ServiceManager', 'Technician', 'Customer'] },
                { path: '/app/parts', roles: ['Admin', 'ServiceManager', 'Technician'] },
                { path: '/app/service-history', roles: ['Customer'] },
                { path: '/app/track-service', roles: ['Customer'] },
                { path: '/app/my-vehicles', roles: ['Customer'] },
                { path: '/app/book-service', roles: ['Customer'] },
                { path: '/app/technicians', roles: ['Admin', 'ServiceManager'] },
                { path: '/app/categories', roles: ['Admin', 'ServiceManager'] },
                { path: '/app/reports', roles: ['Admin', 'ServiceManager'] },
                { path: '/app/part-orders', roles: ['Admin', 'ServiceManager'] },
                { path: '/app/assign-task', roles: ['Admin', 'ServiceManager'] }
            ];
            
            const matchedRoute = roleRestrictedRoutes.find(r => url.startsWith(r.path));
            
            if (matchedRoute && !matchedRoute.roles.includes(userRole)) {
                console.log(`User role ${userRole} cannot access ${url}, redirecting to dashboard`);
                this.router.navigate(['/app/dashboard']);
                return;
            }
            
            this.router.navigateByUrl(url).catch(err => {
                console.error('Navigation failed:', err);
                this.router.navigate(['/app/dashboard']);
            });
        }
    }

    markAllRead() {
        this.notificationService.markAllAsRead().subscribe({
            next: () => {
                this.notifications.forEach(n => n.isRead = true);
                this.notificationService.resetUnreadCount();
            }
        });
    }

    getTypeColor(type: string): string {
        return this.notificationService.getTypeColor(type);
    }
}
