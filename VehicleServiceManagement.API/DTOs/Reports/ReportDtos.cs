namespace VehicleServiceManagement.API.DTOs.Reports
{
    public class DashboardReportDto
    {
        public ServiceStatusSummaryDto ServiceStatusSummary { get; set; } = new();
        public List<ServiceByStatusDto> ServicesByStatus { get; set; } = new();
        public List<TodayScheduledServiceDto> TodayScheduledServices { get; set; } = new();
        public RevenueOverviewDto RevenueOverview { get; set; } = new();
        public int TotalCustomers { get; set; }
        public int TotalVehicles { get; set; }
        public int TotalTechnicians { get; set; }
        public int LowStockPartsCount { get; set; }
    }

    public class ServiceStatusSummaryDto
    {
        public int Pending { get; set; }
        public int InProgress { get; set; }
        public int Completed { get; set; }
        public int Cancelled { get; set; }
        public int TotalActive { get; set; }
    }

    public class ServiceByStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class TodayScheduledServiceDto
    {
        public int ServiceRequestId { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string TechnicianName { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }

    public class RevenueOverviewDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal ThisMonthRevenue { get; set; }
        public decimal PendingPayments { get; set; }
    }
    public class TechnicianWorkloadReportDto
    {
        public List<TechnicianWorkloadDto> Workloads { get; set; } = new();
        public int TotalAssignments { get; set; }
        public int TotalCompleted { get; set; }
        public double AverageCompletionTimeHours { get; set; }
    }

    public class TechnicianWorkloadDto
    {
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TotalAssignments { get; set; }
        public int CompletedAssignments { get; set; }
        public int PendingAssignments { get; set; }
        public int InProgressAssignments { get; set; }
        public double AverageCompletionTimeHours { get; set; }
        public decimal TotalRevenueGenerated { get; set; }
        public double CompletionRate { get; set; }
    }
    public class MonthlyRevenueReportDto
    {
        public List<MonthlyRevenueDto> MonthlyRevenues { get; set; } = new();
        public List<RevenueByCategoryDto> RevenueByCategory { get; set; } = new();
        public PaymentStatusSummaryDto PaymentStatusSummary { get; set; } = new();
        public decimal TotalRevenue { get; set; }
        public decimal AverageMonthlyRevenue { get; set; }
    }

    public class MonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int ServiceCount { get; set; }
        public decimal GrowthPercentage { get; set; }
    }

    public class RevenueByCategoryDto
    {
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int ServiceCount { get; set; }
        public decimal Percentage { get; set; }
    }

    public class PaymentStatusSummaryDto
    {
        public decimal TotalBilled { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal TotalPending { get; set; }
        public decimal TotalOverdue { get; set; }
        public int PaidCount { get; set; }
        public int PendingCount { get; set; }
        public int OverdueCount { get; set; }
    }
    public class VehicleServiceHistoryDto
    {
        public int VehicleId { get; set; }
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalAmountSpent { get; set; }
        public int TotalServices { get; set; }
        public List<ServiceHistoryItemDto> ServiceHistory { get; set; } = new();
        public List<PartReplacementHistoryDto> PartReplacements { get; set; } = new();
    }

    public class ServiceHistoryItemDto
    {
        public int ServiceRequestId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string IssueDescription { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Cost { get; set; }
        public string? TechnicianName { get; set; }
    }

    public class PartReplacementHistoryDto
    {
        public int ServiceRequestId { get; set; }
        public DateTime ServiceDate { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal TotalCost { get; set; }
    }
    public class ServiceStatisticsDto
    {
        public List<ServicesByPriorityDto> ServicesByPriority { get; set; } = new();
        public decimal AverageServiceCost { get; set; }
        public List<TopCategoryDto> TopCategories { get; set; } = new();
        public List<CommonIssueDto> CommonIssues { get; set; } = new();
        public List<ServicesByVehicleTypeDto> ServicesByVehicleType { get; set; } = new();
        public int TotalServicesCompleted { get; set; }
        public double AverageCompletionTimeHours { get; set; }
    }

    public class ServicesByPriorityDto
    {
        public string Priority { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
        public decimal AverageCost { get; set; }
    }

    public class TopCategoryDto
    {
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public int ServiceCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageCost { get; set; }
    }

    public class CommonIssueDto
    {
        public string Issue { get; set; } = string.Empty;
        public int Count { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }

    public class ServicesByVehicleTypeDto
    {
        public string VehicleType { get; set; } = string.Empty;
        public int ServiceCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AverageCost { get; set; }
    }
}
