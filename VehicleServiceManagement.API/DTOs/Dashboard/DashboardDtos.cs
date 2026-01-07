namespace VehicleServiceManagement.API.DTOs.Dashboard
{
    #region Service Request Filtering

    /// <summary>
    /// Filter criteria for service requests using dynamic LINQ conditions
    /// </summary>
    public class ServiceRequestFilterDto
    {
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? TechnicianId { get; set; }
        public int? CustomerId { get; set; }
        public int? CategoryId { get; set; }
        public int? VehicleId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    /// <summary>
    /// Filtered service request result with pagination
    /// </summary>
    public class FilteredServiceRequestDto
    {
        public int ServiceRequestId { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string IssueDescription { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal EstimatedCost { get; set; }
        public decimal ActualCost { get; set; }
        public string? TechnicianName { get; set; }
    }

    #endregion

    #region Technician Workload

    /// <summary>
    /// Response DTO for technician workload endpoint
    /// Demonstrates LINQ grouping by technician
    /// </summary>
    public class TechnicianWorkloadResponseDto
    {
        public List<TechnicianWorkloadItemDto> Workloads { get; set; } = new();
        public int TotalTechnicians { get; set; }
        public int TotalAssignments { get; set; }
        public int TotalCompleted { get; set; }
        public double OverallCompletionRate { get; set; }
        public double AverageWorkloadPerTechnician { get; set; }
    }

    public class TechnicianWorkloadItemDto
    {
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public int InProgressAssignments { get; set; }
        public double CompletionRate { get; set; }
        public double AverageCompletionTimeHours { get; set; }
        public decimal TotalRevenueGenerated { get; set; }
        public string WorkloadStatus { get; set; } = string.Empty;
    }

    #endregion

    #region Monthly Services

    /// <summary>
    /// Response DTO for monthly services endpoint
    /// Demonstrates LINQ aggregation with Year + Month grouping
    /// </summary>
    public class MonthlyServicesResponseDto
    {
        public List<MonthlyServiceItemDto> MonthlyData { get; set; } = new();
        public int TotalServicesThisYear { get; set; }
        public double AverageServicesPerMonth { get; set; }
        public string BusiestMonth { get; set; } = string.Empty;
        public string SlowMonth { get; set; } = string.Empty;
        public int Year { get; set; }
    }

    public class MonthlyServiceItemDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int TotalServices { get; set; }
        public int CompletedServices { get; set; }
        public int CancelledServices { get; set; }
        public decimal TotalRevenue { get; set; }
        public double GrowthPercentage { get; set; }
    }

    #endregion

    #region Revenue by Category

    /// <summary>
    /// Response DTO for revenue by category endpoint
    /// Demonstrates LINQ aggregation with sum of service cost
    /// </summary>
    public class RevenueByCategoryResponseDto
    {
        public List<CategoryRevenueItemDto> Categories { get; set; } = new();
        public decimal TotalRevenue { get; set; }
        public string TopCategory { get; set; } = string.Empty;
        public int TotalServiceCount { get; set; }
        public decimal AverageRevenuePerCategory { get; set; }
    }

    public class CategoryRevenueItemDto
    {
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int ServiceCount { get; set; }
        public decimal Percentage { get; set; }
        public decimal AverageServiceCost { get; set; }
    }

    #endregion

    #region Services by Vehicle Type

    /// <summary>
    /// Response DTO for services grouped by vehicle type
    /// Demonstrates LINQ grouping by vehicle type
    /// </summary>
    public class ServicesByVehicleTypeResponseDto
    {
        public List<VehicleTypeServiceItemDto> VehicleTypes { get; set; } = new();
        public int TotalServices { get; set; }
        public string MostServicedVehicleType { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
    }

    public class VehicleTypeServiceItemDto
    {
        public string VehicleType { get; set; } = string.Empty;
        public int ServiceCount { get; set; }
        public decimal Percentage { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageServiceCost { get; set; }
    }

    #endregion

    #region Services by Category

    /// <summary>
    /// Response DTO for services grouped by service category
    /// Demonstrates LINQ grouping by service category
    /// </summary>
    public class ServicesByCategoryResponseDto
    {
        public List<CategoryServiceItemDto> Categories { get; set; } = new();
        public int TotalServices { get; set; }
        public string MostPopularCategory { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
    }

    public class CategoryServiceItemDto
    {
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int ServiceCount { get; set; }
        public decimal Percentage { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal BasePrice { get; set; }
        public int EstimatedDurationMinutes { get; set; }
    }

    #endregion

    #region Dashboard Summary

    /// <summary>
    /// Comprehensive dashboard summary DTO
    /// Combines multiple LINQ queries for a complete dashboard view
    /// </summary>
    public class DashboardSummaryDto
    {
        public int RequestedCount { get; set; }
        public int AssignedCount { get; set; }
        public int InProgressCount { get; set; }
        public int CompletedCount { get; set; }
        public int ClosedCount { get; set; }
        public int CancelledCount { get; set; }
        public int TotalActiveServices { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal ThisWeekRevenue { get; set; }
        public decimal ThisMonthRevenue { get; set; }
        public decimal PendingPayments { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalVehicles { get; set; }
        public int TotalTechnicians { get; set; }
        public int TotalServiceCategories { get; set; }
        public int LowStockPartsCount { get; set; }
        public List<RecentServiceDto> RecentServices { get; set; } = new();
        public List<DashboardTodayScheduledServiceDto> TodayScheduled { get; set; } = new();
        public double AverageCompletionTimeHours { get; set; }
        public double CustomerSatisfactionRate { get; set; }
        public int UrgentServicesCount { get; set; }
    }

    public class RecentServiceDto
    {
        public int ServiceRequestId { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public string Priority { get; set; } = string.Empty;
    }

    public class DashboardTodayScheduledServiceDto
    {
        public int ServiceRequestId { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? TechnicianName { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }

    #endregion

    #region Admin Dashboard

    public class AdminDashboardDto
    {
        public List<NewUserDto> NewUsers { get; set; } = new();
        public List<PendingApprovalUserDto> PendingApprovals { get; set; } = new();
        public List<TopCategoryDto> TopCategories { get; set; } = new();
        public List<TopPartDto> TopParts { get; set; } = new();
        public List<LowStockPartDto> LowStockParts { get; set; } = new();
    }

    public class NewUserDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class PendingApprovalUserDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }

    public class TopCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int ServiceCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class TopPartDto
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int TotalUsed { get; set; }
        public decimal Revenue { get; set; }
    }

    public class LowStockPartDto
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public int MinimumStock { get; set; }
    }

    #endregion
}
