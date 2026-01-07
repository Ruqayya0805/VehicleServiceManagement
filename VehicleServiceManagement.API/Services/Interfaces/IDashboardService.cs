using VehicleServiceManagement.API.DTOs.Dashboard;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    /// <summary>
    /// Interface for Dashboard Service - Demonstrates strong LINQ usage
    /// All methods use LINQ for filtering, grouping, and aggregation
    /// </summary>
    public interface IDashboardService
    {
        #region Service Request Filtering (LINQ)

        /// <summary>
        /// Filter service requests using dynamic LINQ conditions
        /// Supports filtering by Status, Priority, and Date Range
        /// </summary>
        Task<(List<FilteredServiceRequestDto> Items, int TotalCount)> GetFilteredServiceRequestsAsync(ServiceRequestFilterDto filter);

        #endregion

        #region Grouping Queries (LINQ)

        /// <summary>
        /// Get technician workload - Services grouped by Technician
        /// Demonstrates LINQ GroupBy and aggregation
        /// </summary>
        Task<TechnicianWorkloadResponseDto> GetTechnicianWorkloadAsync();

        /// <summary>
        /// Get services grouped by Vehicle Type
        /// Demonstrates LINQ GroupBy with navigation properties
        /// </summary>
        Task<ServicesByVehicleTypeResponseDto> GetServicesByVehicleTypeAsync();

        /// <summary>
        /// Get services grouped by Service Category
        /// Demonstrates LINQ GroupBy with join operations
        /// </summary>
        Task<ServicesByCategoryResponseDto> GetServicesByCategoryAsync();

        #endregion

        #region Aggregation & Reporting (LINQ)

        /// <summary>
        /// Get total services per month (Year + Month grouping)
        /// Demonstrates LINQ GroupBy with multiple keys and aggregation
        /// </summary>
        Task<MonthlyServicesResponseDto> GetMonthlyServicesAsync(int? year = null);

        /// <summary>
        /// Get revenue per service category (sum of service cost)
        /// Demonstrates LINQ Sum aggregation with GroupBy
        /// </summary>
        Task<RevenueByCategoryResponseDto> GetRevenueByCategoryAsync();

        #endregion

        #region Dashboard Summary

        /// <summary>
        /// Get comprehensive dashboard summary
        /// Combines multiple LINQ queries for complete dashboard view
        /// </summary>
        Task<DashboardSummaryDto> GetDashboardSummaryAsync();

        #endregion

        #region Admin Dashboard

        /// <summary>
        /// Get admin-specific dashboard data
        /// Includes new users, pending approvals, top categories/parts, low stock
        /// </summary>
        Task<AdminDashboardDto> GetAdminDashboardAsync();

        #endregion
    }
}
