import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated) {
        return true;
    }
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated) {
        router.navigate(['/login']);
        return false;
    }

    const roles = route.data['roles'] as string[];
    if (roles && roles.length > 0 && authService.hasRole(roles)) {
        return true;
    }
    console.warn(`Access denied: User role '${authService.userRole}' not in required roles: ${roles.join(', ')}`);
    router.navigate(['/app/dashboard']);
    return false;
};

export const guestGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated) {
        return true;
    }
    router.navigate(['/app/dashboard']);
    return false;
};
