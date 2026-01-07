import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
    ApiResponse,
    PagedResult,
    ServiceRequestFilter,
    FilteredServiceRequest,
    TechnicianWorkloadResponse,
    MonthlyServicesResponse,
    RevenueByCategoryResponse,
    ServicesByVehicleTypeResponse,
    ServicesByCategoryResponse,
    DashboardSummary
} from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly api = inject(ApiService);

    getDashboardSummary(): Observable<DashboardSummary> {
        return this.api.get<DashboardSummary>('/dashboard').pipe(
            map(response => response.data)
        );
    }
    getFilteredServiceRequests(filter: Partial<ServiceRequestFilter>): Observable<PagedResult<FilteredServiceRequest>> {
        const params: Record<string, any> = {};

        if (filter.status) params['status'] = filter.status;
        if (filter.priority) params['priority'] = filter.priority;
        if (filter.fromDate) params['fromDate'] = filter.fromDate;
        if (filter.toDate) params['toDate'] = filter.toDate;
        if (filter.technicianId) params['technicianId'] = filter.technicianId;
        if (filter.customerId) params['customerId'] = filter.customerId;
        if (filter.categoryId) params['categoryId'] = filter.categoryId;
        if (filter.vehicleId) params['vehicleId'] = filter.vehicleId;
        params['pageNumber'] = filter.pageNumber || 1;
        params['pageSize'] = filter.pageSize || 10;

        return this.api.get<PagedResult<FilteredServiceRequest>>('/dashboard/service-requests', params).pipe(
            map(response => response.data)
        );
    }
    getTechnicianWorkload(): Observable<TechnicianWorkloadResponse> {
        return this.api.get<TechnicianWorkloadResponse>('/dashboard/technician-workload').pipe(
            map(response => response.data)
        );
    }

    getMonthlyServices(year?: number): Observable<MonthlyServicesResponse> {
        const params: Record<string, any> = {};
        if (year) params['year'] = year;

        return this.api.get<MonthlyServicesResponse>('/dashboard/monthly-services', params).pipe(
            map(response => response.data)
        );
    }

    getRevenueByCategory(): Observable<RevenueByCategoryResponse> {
        return this.api.get<RevenueByCategoryResponse>('/dashboard/revenue-by-category').pipe(
            map(response => response.data)
        );
    }

    getServicesByVehicleType(): Observable<ServicesByVehicleTypeResponse> {
        return this.api.get<ServicesByVehicleTypeResponse>('/dashboard/services-by-vehicle-type').pipe(
            map(response => response.data)
        );
    }

    getServicesByCategory(): Observable<ServicesByCategoryResponse> {
        return this.api.get<ServicesByCategoryResponse>('/dashboard/services-by-category').pipe(
            map(response => response.data)
        );
    }
}
