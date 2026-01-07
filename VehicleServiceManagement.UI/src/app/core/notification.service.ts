import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, interval, switchMap, startWith } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from './models';

export interface InAppNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    typeIcon: string;
    isRead: boolean;
    createdAt: string;
    timeAgo: string;
    relatedEntityId?: number;
    relatedEntityType?: string;
    actionUrl?: string;
    createdByName?: string;
}

export interface NotificationList {
    notifications: InAppNotification[];
    totalCount: number;
    unreadCount: number;
}

export interface UnreadCount {
    count: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private api = inject(ApiService);

    private unreadCountSubject = new BehaviorSubject<number>(0);
    unreadCount$ = this.unreadCountSubject.asObservable();

    private pollInterval = 30000;

    /**
     * Start polling for unread count
     */
    startPolling(): Observable<number> {
        return interval(this.pollInterval).pipe(
            startWith(0),
            switchMap(() => this.fetchUnreadCount())
        );
    }

    /**
     * Get notifications for current user
     */
    getNotifications(skip = 0, take = 20, unreadOnly = false): Observable<ApiResponse<NotificationList>> {
        return this.api.get<NotificationList>(`/notifications?skip=${skip}&take=${take}&unreadOnly=${unreadOnly}`);
    }

    /**
     * Get unread notification count
     */
    getUnreadCount(): Observable<ApiResponse<UnreadCount>> {
        return this.api.get<UnreadCount>('/notifications/unread-count');
    }

    /**
     * Fetch and update unread count subject
     */
    fetchUnreadCount(): Observable<number> {
        return new Observable(observer => {
            this.getUnreadCount().subscribe({
                next: (res) => {
                    const count = res.data?.count || 0;
                    this.unreadCountSubject.next(count);
                    observer.next(count);
                    observer.complete();
                },
                error: (err) => {
                    observer.next(this.unreadCountSubject.value);
                    observer.complete();
                }
            });
        });
    }

    /**
     * Mark a notification as read
     */
    markAsRead(id: string): Observable<ApiResponse<boolean>> {
        return this.api.post<boolean>(`/notifications/${id}/read`, {});
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<ApiResponse<number>> {
        return this.api.post<number>('/notifications/read-all', {});
    }

    /**
     * Update unread count locally (for optimistic updates)
     */
    decrementUnreadCount(): void {
        const current = this.unreadCountSubject.value;
        if (current > 0) {
            this.unreadCountSubject.next(current - 1);
        }
    }

    /**
     * Reset unread count to 0
     */
    resetUnreadCount(): void {
        this.unreadCountSubject.next(0);
    }

    /**
     * Get icon class for notification type
     */
    getTypeColor(type: string): string {
        const colors: Record<string, string> = {
            'ServiceRequestCreated': '#28a745',
            'ServiceRequestCompleted': '#17a2b8',
            'TechnicianAssigned': '#6f42c1',
            'BillGenerated': '#ffc107',
            'PaymentReceived': '#28a745',
            'LowStockAlert': '#dc3545',
            'AccountApproved': '#28a745',
            'SystemAlert': '#6c757d'
        };
        return colors[type] || '#0d6efd';
    }
}
