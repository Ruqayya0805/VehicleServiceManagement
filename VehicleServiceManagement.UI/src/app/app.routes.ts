import { Routes } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent) },
    { path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./pages/register.component').then(m => m.RegisterComponent) },
    { path: 'staff-register', loadComponent: () => import('./pages/staff-register.component').then(m => m.StaffRegisterComponent) },
    { path: 'verify-otp', loadComponent: () => import('./pages/verify-otp.component').then(m => m.VerifyOtpComponent) },
    { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password.component').then(m => m.ForgotPasswordComponent) },
    { path: 'reset-password', loadComponent: () => import('./pages/reset-password.component').then(m => m.ResetPasswordComponent) },

    {
        path: 'app',
        canActivate: [authGuard],
        loadComponent: () => import('./layouts/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'service-requests', canActivate: [roleGuard], data: { roles: ['ServiceManager', 'Technician', 'Customer'] }, loadComponent: () => import('./pages/service-requests.component').then(m => m.ServiceRequestsComponent) },
            { path: 'vehicles', loadComponent: () => import('./pages/vehicles.component').then(m => m.VehiclesComponent) },
            { path: 'assignments', loadComponent: () => import('./pages/assignments.component').then(m => m.AssignmentsComponent) },
            { path: 'technicians', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/technicians.component').then(m => m.TechniciansComponent) },
            { path: 'assign-task', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/assign-task.component').then(m => m.AssignTaskComponent) },
            { path: 'parts', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager', 'Technician'] }, loadComponent: () => import('./pages/parts.component').then(m => m.PartsComponent) },
            { path: 'parts/add', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/part-form.component').then(m => m.PartFormComponent) },
            { path: 'parts/edit/:id', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/part-form.component').then(m => m.PartFormComponent) },
            { path: 'parts/order/:partId', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/place-order.component').then(m => m.PlaceOrderComponent) },
            { path: 'part-orders', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/part-orders.component').then(m => m.PartOrdersComponent) },
            { path: 'bills', loadComponent: () => import('./pages/bills.component').then(m => m.BillsComponent) },
            { path: 'bills/:id', loadComponent: () => import('./pages/bill-details.component').then(m => m.BillDetailsComponent) },
            { path: 'users', canActivate: [roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./pages/users.component').then(m => m.UsersComponent) },
            { path: 'categories', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/categories.component').then(m => m.CategoriesComponent) },
            { path: 'categories/add', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/category-form.component').then(m => m.CategoryFormComponent) },
            { path: 'categories/edit/:id', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/category-form.component').then(m => m.CategoryFormComponent) },
            { path: 'reports', canActivate: [roleGuard], data: { roles: ['Admin', 'ServiceManager'] }, loadComponent: () => import('./pages/dashboard-reports.component').then(m => m.DashboardReportsComponent) },
            { path: 'dashboard-reports', redirectTo: 'reports', pathMatch: 'full' },
            { path: 'profile', loadComponent: () => import('./pages/profile.component').then(m => m.ProfileComponent) },
            { path: 'my-vehicles', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/my-vehicles.component').then(m => m.MyVehiclesComponent) },
            { path: 'my-vehicles/add', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/vehicle-form.component').then(m => m.VehicleFormComponent) },
            { path: 'my-vehicles/edit/:id', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/vehicle-form.component').then(m => m.VehicleFormComponent) },
            { path: 'book-service', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/book-service.component').then(m => m.BookServiceComponent) },
            { path: 'track-service', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/track-service.component').then(m => m.TrackServiceComponent) },
            { path: 'service-history', canActivate: [roleGuard], data: { roles: ['Customer'] }, loadComponent: () => import('./pages/customer/service-history.component').then(m => m.ServiceHistoryComponent) },
        ]
    },
    { path: '**', redirectTo: '' }
];
