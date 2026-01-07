import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get<T>(endpoint: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.set(key, params[key].toString());
                }
            });
        }
        return this.http.get<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, { params: httpParams });
    }

    post<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
    }

    postWithToken<T>(endpoint: string, body: any, token: string): Observable<ApiResponse<T>> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.post<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body, { headers });
    }

    put<T>(endpoint: string, body: any): Observable<ApiResponse<T>> {
        return this.http.put<ApiResponse<T>>(`${this.baseUrl}${endpoint}`, body);
    }

    delete<T>(endpoint: string): Observable<ApiResponse<T>> {
        return this.http.delete<ApiResponse<T>>(`${this.baseUrl}${endpoint}`);
    }
}
