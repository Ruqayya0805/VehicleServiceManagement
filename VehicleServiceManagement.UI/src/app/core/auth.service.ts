import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest } from './models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';
const PENDING_EMAIL_KEY = 'pending_email_verification';
export interface VerifyOtpRequest {
    email: string;
    otp: string;
}

export interface ResendOtpRequest {
    email: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordWithTokenRequest {
    token: string;
    newPassword: string;
    confirmPassword: string;
}

export interface OtpVerificationResponse {
    isVerified: boolean;
    message: string;
    remainingAttempts?: number;
}

export interface AuthOperationResponse {
    success: boolean;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private api = inject(ApiService);
    private router = inject(Router);
    private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());

    currentUser$ = this.currentUserSubject.asObservable();

    get currentUser(): AuthResponse | null {
        return this.currentUserSubject.value;
    }

    get isAuthenticated(): boolean {
        return !!this.getToken();
    }

    get userRole(): string | null {
        return this.currentUser?.role || null;
    }
    register(userData: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
        return this.api.post<AuthResponse>('/auth/register', userData).pipe(
            tap(res => {
                if (res.success && res.data) {
                    this.setPendingEmailVerification(userData.email);
                }
            })
        );
    }

    registerStaff(userData: any): Observable<ApiResponse<any>> {
        return this.api.post<any>('/auth/register-staff', userData).pipe(
            tap(res => {
                if (res.success) {
                    this.setPendingEmailVerification(userData.email);
                }
            })
        );
    }
    verifyOtp(data: VerifyOtpRequest): Observable<ApiResponse<OtpVerificationResponse>> {
        return this.api.post<OtpVerificationResponse>('/auth/verify-otp', data).pipe(
            tap(res => {
                if (res.success && res.data?.isVerified) {
                    this.clearPendingEmailVerification();
                }
            })
        );
    }

    resendOtp(data: ResendOtpRequest): Observable<ApiResponse<AuthOperationResponse>> {
        return this.api.post<AuthOperationResponse>('/auth/resend-otp', data);
    }

    getPendingEmailVerification(): string | null {
        return localStorage.getItem(PENDING_EMAIL_KEY);
    }

    setPendingEmailVerification(email: string): void {
        localStorage.setItem(PENDING_EMAIL_KEY, email);
    }

    clearPendingEmailVerification(): void {
        localStorage.removeItem(PENDING_EMAIL_KEY);
    }
    login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
        return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
            tap(res => {
                if (res.success && res.data) {
                    this.setSession(res.data);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PENDING_EMAIL_KEY);
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }
    forgotPassword(data: ForgotPasswordRequest): Observable<ApiResponse<AuthOperationResponse>> {
        return this.api.post<AuthOperationResponse>('/auth/forgot-password', data);
    }

    resetPasswordWithToken(data: ResetPasswordWithTokenRequest): Observable<ApiResponse<AuthOperationResponse>> {
        return this.api.post<AuthOperationResponse>('/auth/reset-password-with-token', data);
    }
    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    private setSession(auth: AuthResponse): void {
        localStorage.setItem(TOKEN_KEY, auth.token);
        localStorage.setItem(USER_KEY, JSON.stringify(auth));
        this.currentUserSubject.next(auth);
    }

    private getStoredUser(): AuthResponse | null {
        const json = localStorage.getItem(USER_KEY);
        return json ? JSON.parse(json) : null;
    }
    isAdmin(): boolean { return this.userRole === 'Admin'; }
    isManager(): boolean { return this.userRole === 'ServiceManager'; }
    isTechnician(): boolean { return this.userRole === 'Technician'; }
    isCustomer(): boolean { return this.userRole === 'Customer'; }
    hasRole(roles: string[]): boolean { return this.userRole ? roles.includes(this.userRole) : false; }
}
