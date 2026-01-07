export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: string;
}

export interface AuthResponse {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    token: string;
}
export interface User {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
}

export interface Technician {
    userId: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    activeAssignments: number;
    completedAssignments: number;
}
export interface Vehicle {
    vehicleId: number;
    customerId: number;
    customerName: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    fuelType: string;
    color: string;
    rcNumber: string;
}
export interface ServiceCategory {
    categoryId: number;
    categoryName: string;
    description: string;
    basePrice: number;
    estimatedDurationMinutes: number;
    isActive: boolean;
}
export interface ServiceRequest {
    serviceRequestId: number;
    vehicleId: number;
    vehicleInfo: string;
    registrationNumber: string;
    customerId: number;
    customerName: string;
    categoryId: number;
    categoryName: string;
    issueDescription: string;
    priority: string;
    status: string;
    requestedDate: string;
    scheduledDate: string;
    completedDate?: string;
    customerRemarks?: string;
    technicianRemarks?: string;
    estimatedCost: number;
    actualCost: number;
    hasBill: boolean;
    selectedServices?: ServiceCategoryInfo[];
    tasks?: ServiceTask[];
    assignment?: ServiceAssignmentSummary;
}

export interface ServiceTask {
    serviceTaskId: number;
    serviceRequestId: number;
    description: string;
    isCompleted: boolean;
    completedDate?: string;
    completedByUserId?: number;
    completedByName?: string;
    price?: number;
    orderIndex: number;
}

export interface ServiceCategoryInfo {
    categoryId: number;
    categoryName: string;
    basePrice: number;
}

export interface ServiceAssignmentSummary {
    assignmentId: number;
    technicianId: number;
    technicianName: string;
    status: string;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
}
export interface ServiceAssignment {
    assignmentId: number;
    serviceRequestId: number;
    technicianId: number;
    technicianName: string;
    assignedDate: string;
    startedDate?: string;
    completedDate?: string;
    status: string;
    notes?: string;
    serviceDescription?: string;
    issueDescription?: string;
    vehicleInfo?: string;
    customerName?: string;
    priority?: string;
    hasBill?: boolean;
    billId?: number;
    isClosed?: boolean;
    tasks?: ServiceTask[];
}
export interface ServicePart {
    servicePartId: number;
    serviceRequestId: number;
    partId: number;
    partName: string;
    partNumber: string;
    quantityUsed: number;
    unitPrice: number;
    totalPrice: number;
}

export interface CreateServicePart {
    serviceRequestId: number;
    partId: number;
    quantityUsed: number;
}
export interface Part {
    partId: number;
    partName: string;
    partNumber: string;
    description: string;
    unitPrice: number;
    quantityInStock: number;
    reorderLevel: number;
    supplier: string;
}

export interface LowStockPart {
    partId: number;
    partName: string;
    partNumber: string;
    quantityInStock: number;
    reorderLevel: number;
    deficit: number;
    supplier: string;
}
export interface BillServiceItem {
    categoryId: number;
    categoryName: string;
    originalPrice: number;
    adjustedPrice: number;
}

export interface BillPartItem {
    partId: number;
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Bill {
    billId: number;
    billNumber: string;
    serviceRequestId: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    vehicleInfo: string;
    serviceCharge: number;
    partsCharge: number;
    subTotal: number;
    tax: number;
    taxPercentage: number;
    discount: number;
    discountPercentage: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    generatedDate: string;
    dueDate: string;
    paymentStatus: string;
    isClosed: boolean;
    serviceItems: BillServiceItem[];
    partItems: BillPartItem[];
    tasks?: ServiceTask[];
}

export interface BillSummary {
    billId: number;
    billNumber: string;
    serviceRequestId: number;
    customerName: string;
    vehicleInfo: string;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    generatedDate: string;
    dueDate: string;
    paymentStatus: string;
    isClosed: boolean;
}

export interface UpdateBill {
    serviceItemPrices?: { [categoryId: number]: number };
    discountPercentage?: number;
    finalizeBill?: boolean;
}

export interface CreatePayment {
    billId: number;
    amountPaid: number;
    paymentMethod: string;
    transactionId?: string;
}
export interface Payment {
    paymentId: number;
    billId: number;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    transactionId?: string;
}

export interface AdminDashboard {
    newUsers: NewUser[];
    pendingApprovals: PendingApprovalUser[];
    topCategories: TopCategory[];
    topParts: TopPart[];
    lowStockParts: LowStockPart[];
}

export interface NewUser {
    userId: number;
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
}

export interface PendingApprovalUser {
    userId: number;
    fullName: string;
    email: string;
    role: string;
    createdDate: string;
}

export interface TopCategory {
    categoryId: number;
    categoryName: string;
    serviceCount: number;
    revenue: number;
}

export interface TopPart {
    partId: number;
    partName: string;
    partNumber: string;
    totalUsed: number;
    revenue: number;
}

export interface LowStockPart {
    partId: number;
    partName: string;
    partNumber: string;
    currentStock: number;
    minimumStock: number;
}

export interface DashboardReport {
    serviceStatusSummary: {
        pending: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        totalActive: number;
    };
    servicesByStatus: { status: string; count: number; percentage: number }[];
    todayScheduledServices: TodayScheduledService[];
    revenueOverview: {
        totalRevenue: number;
        todayRevenue: number;
        thisMonthRevenue: number;
        pendingPayments: number;
    };
    totalCustomers: number;
    totalVehicles: number;
    totalTechnicians: number;
    lowStockPartsCount: number;
}

export interface TodayScheduledService {
    serviceRequestId: number;
    vehicleInfo: string;
    customerName: string;
    categoryName: string;
    technicianName: string;
    scheduledDate: string;
    status: string;
    priority: string;
}

export interface TechnicianWorkloadReport {
    workloads: TechnicianWorkload[];
    totalAssignments: number;
    totalCompleted: number;
    averageCompletionTimeHours: number;
}

export interface TechnicianWorkload {
    technicianId: number;
    technicianName: string;
    email: string;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    inProgressAssignments: number;
    averageCompletionTimeHours: number;
    totalRevenueGenerated: number;
    completionRate: number;
}

export interface MonthlyRevenueReport {
    monthlyRevenues: MonthlyRevenue[];
    revenueByCategory: RevenueByCategory[];
    paymentStatusSummary: {
        totalBilled: number;
        totalPaid: number;
        totalPending: number;
        totalOverdue: number;
        paidCount: number;
        pendingCount: number;
        overdueCount: number;
    };
    totalRevenue: number;
    averageMonthlyRevenue: number;
}

export interface MonthlyRevenue {
    year: number;
    month: number;
    monthName: string;
    revenue: number;
    serviceCount: number;
    growthPercentage: number;
}

export interface RevenueByCategory {
    categoryId: number;
    categoryName: string;
    revenue: number;
    serviceCount: number;
    percentage: number;
}

export interface VehicleServiceHistory {
    vehicleId: number;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    customerName: string;
    totalAmountSpent: number;
    totalServices: number;
    serviceHistory: ServiceHistoryItem[];
    partReplacements: PartReplacementHistory[];
}

export interface ServiceHistoryItem {
    serviceRequestId: number;
    categoryName: string;
    issueDescription: string;
    requestedDate: string;
    completedDate?: string;
    status: string;
    cost: number;
    technicianName?: string;
}

export interface PartReplacementHistory {
    serviceRequestId: number;
    serviceDate: string;
    partName: string;
    partNumber: string;
    quantity: number;
    totalCost: number;
}
export interface PartOrder {
    partOrderId: number;
    orderNumber: string;
    partId: number;
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    supplier: string;
    status: string;
    orderDate: string;
    expectedDeliveryDate?: string;
    deliveredDate?: string;
    orderedByUserId: number;
    orderedByName: string;
    notes: string;
    currentStock: number;
    reorderLevel: number;
}

export interface PartOrderSummary {
    partOrderId: number;
    orderNumber: string;
    partName: string;
    quantity: number;
    totalAmount: number;
    supplier: string;
    status: string;
    orderDate: string;
    expectedDeliveryDate?: string;
}

export interface CreatePartOrder {
    partId: number;
    quantity: number;
    unitPrice?: number;
    expectedDeliveryDate?: string;
    notes: string;
}
export interface ServiceRequestFilter {
    status?: string;
    priority?: string;
    fromDate?: string;
    toDate?: string;
    technicianId?: number;
    customerId?: number;
    categoryId?: number;
    vehicleId?: number;
    pageNumber: number;
    pageSize: number;
}

export interface FilteredServiceRequest {
    serviceRequestId: number;
    vehicleInfo: string;
    registrationNumber: string;
    customerName: string;
    categoryName?: string;
    issueDescription: string;
    priority: string;
    status: string;
    requestedDate: string;
    scheduledDate?: string;
    completedDate?: string;
    estimatedCost: number;
    actualCost: number;
    technicianName?: string;
}
export interface TechnicianWorkloadResponse {
    workloads: TechnicianWorkloadItem[];
    totalTechnicians: number;
    totalAssignments: number;
    totalCompleted: number;
    overallCompletionRate: number;
    averageWorkloadPerTechnician: number;
}

export interface TechnicianWorkloadItem {
    technicianId: number;
    technicianName: string;
    email: string;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    inProgressAssignments: number;
    completionRate: number;
    averageCompletionTimeHours: number;
    totalRevenueGenerated: number;
    workloadStatus: string;
}
export interface MonthlyServicesResponse {
    monthlyData: MonthlyServiceItem[];
    totalServicesThisYear: number;
    averageServicesPerMonth: number;
    busiestMonth: string;
    slowMonth: string;
    year: number;
}

export interface MonthlyServiceItem {
    year: number;
    month: number;
    monthName: string;
    totalServices: number;
    completedServices: number;
    cancelledServices: number;
    totalRevenue: number;
    growthPercentage: number;
}
export interface RevenueByCategoryResponse {
    categories: CategoryRevenueItem[];
    totalRevenue: number;
    topCategory: string;
    totalServiceCount: number;
    averageRevenuePerCategory: number;
}

export interface CategoryRevenueItem {
    categoryId?: number;
    categoryName: string;
    revenue: number;
    serviceCount: number;
    percentage: number;
    averageServiceCost: number;
}
export interface ServicesByVehicleTypeResponse {
    vehicleTypes: VehicleTypeServiceItem[];
    totalServices: number;
    mostServicedVehicleType: string;
    totalRevenue: number;
}

export interface VehicleTypeServiceItem {
    vehicleType: string;
    serviceCount: number;
    percentage: number;
    totalRevenue: number;
    averageServiceCost: number;
}
export interface ServicesByCategoryResponse {
    categories: CategoryServiceItem[];
    totalServices: number;
    mostPopularCategory: string;
    totalRevenue: number;
}

export interface CategoryServiceItem {
    categoryId?: number;
    categoryName: string;
    serviceCount: number;
    percentage: number;
    totalRevenue: number;
    basePrice: number;
    estimatedDurationMinutes: number;
}
export interface DashboardSummary {
    requestedCount: number;
    assignedCount: number;
    inProgressCount: number;
    completedCount: number;
    closedCount: number;
    cancelledCount: number;
    totalActiveServices: number;
    totalRevenue: number;
    todayRevenue: number;
    thisWeekRevenue: number;
    thisMonthRevenue: number;
    pendingPayments: number;
    totalCustomers: number;
    totalVehicles: number;
    totalTechnicians: number;
    totalServiceCategories: number;
    lowStockPartsCount: number;
    recentServices: RecentService[];
    todayScheduled: TodayScheduledServiceItem[];
    averageCompletionTimeHours: number;
    customerSatisfactionRate: number;
    urgentServicesCount: number;
}

export interface RecentService {
    serviceRequestId: number;
    vehicleInfo: string;
    customerName: string;
    status: string;
    requestedDate: string;
    priority: string;
}

export interface TodayScheduledServiceItem {
    serviceRequestId: number;
    vehicleInfo: string;
    customerName: string;
    categoryName?: string;
    technicianName?: string;
    scheduledDate?: string;
    status: string;
    priority: string;
}

