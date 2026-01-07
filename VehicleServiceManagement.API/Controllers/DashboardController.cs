using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Dashboard;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Dashboard & Reports Controller - LINQ Demo
    /// This controller exposes RESTful endpoints for dashboard and reporting functionality.
    /// All endpoints use the DashboardService which demonstrates strong LINQ usage.
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        #region Dashboard Summary

        /// <summary>
        /// GET /api/dashboard
        /// Get comprehensive dashboard summary with all key metrics
        /// LINQ: Combines filtering, grouping, and aggregation queries
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<DashboardSummaryDto>), 200)]
        public async Task<IActionResult> GetDashboardSummary()
        {
            var summary = await _dashboardService.GetDashboardSummaryAsync();
            return Ok(new ApiResponse<DashboardSummaryDto>
            {
                Success = true,
                Message = "Dashboard summary retrieved successfully",
                Data = summary
            });
        }

        #endregion

        #region Technician Workload

        /// <summary>
        /// GET /api/dashboard/technician-workload
        /// Get technician workload and performance metrics
        /// LINQ: Services grouped by Technician with aggregation
        /// </summary>
        [HttpGet("technician-workload")]
        [ProducesResponseType(typeof(ApiResponse<TechnicianWorkloadResponseDto>), 200)]
        public async Task<IActionResult> GetTechnicianWorkload()
        {
            var workload = await _dashboardService.GetTechnicianWorkloadAsync();
            return Ok(new ApiResponse<TechnicianWorkloadResponseDto>
            {
                Success = true,
                Message = "Technician workload report generated successfully using LINQ GroupBy",
                Data = workload
            });
        }

        #endregion

        #region Monthly Services

        /// <summary>
        /// GET /api/dashboard/monthly-services
        /// Get total number of services per month (Year + Month grouping)
        /// LINQ: GroupBy with composite key (Year, Month) and aggregation
        /// </summary>
        [HttpGet("monthly-services")]
        [ProducesResponseType(typeof(ApiResponse<MonthlyServicesResponseDto>), 200)]
        public async Task<IActionResult> GetMonthlyServices([FromQuery] int? year = null)
        {
            var monthlyServices = await _dashboardService.GetMonthlyServicesAsync(year);
            return Ok(new ApiResponse<MonthlyServicesResponseDto>
            {
                Success = true,
                Message = $"Monthly services report for {monthlyServices.Year} generated using LINQ GroupBy(Year, Month)",
                Data = monthlyServices
            });
        }

        #endregion

        #region Revenue by Category

        /// <summary>
        /// GET /api/dashboard/revenue-by-category
        /// Get revenue per service category (sum of service cost)
        /// LINQ: GroupBy with Sum aggregation
        /// </summary>
        [HttpGet("revenue-by-category")]
        [ProducesResponseType(typeof(ApiResponse<RevenueByCategoryResponseDto>), 200)]
        public async Task<IActionResult> GetRevenueByCategory()
        {
            var revenue = await _dashboardService.GetRevenueByCategoryAsync();
            return Ok(new ApiResponse<RevenueByCategoryResponseDto>
            {
                Success = true,
                Message = "Revenue by category report generated using LINQ Sum aggregation",
                Data = revenue
            });
        }

        #endregion

        #region Services by Vehicle Type

        /// <summary>
        /// GET /api/dashboard/services-by-vehicle-type
        /// Get services grouped by vehicle type
        /// LINQ: GroupBy with navigation to Vehicle entity
        /// </summary>
        [HttpGet("services-by-vehicle-type")]
        [ProducesResponseType(typeof(ApiResponse<ServicesByVehicleTypeResponseDto>), 200)]
        public async Task<IActionResult> GetServicesByVehicleType()
        {
            var services = await _dashboardService.GetServicesByVehicleTypeAsync();
            return Ok(new ApiResponse<ServicesByVehicleTypeResponseDto>
            {
                Success = true,
                Message = "Services by vehicle type report generated using LINQ GroupBy",
                Data = services
            });
        }

        #endregion

        #region Services by Category

        /// <summary>
        /// GET /api/dashboard/services-by-category
        /// Get services grouped by service category
        /// LINQ: GroupBy with join to ServiceCategory
        /// </summary>
        [HttpGet("services-by-category")]
        [ProducesResponseType(typeof(ApiResponse<ServicesByCategoryResponseDto>), 200)]
        public async Task<IActionResult> GetServicesByCategory()
        {
            var services = await _dashboardService.GetServicesByCategoryAsync();
            return Ok(new ApiResponse<ServicesByCategoryResponseDto>
            {
                Success = true,
                Message = "Services by category report generated using LINQ GroupBy",
                Data = services
            });
        }

        #endregion

        #region Filtered Service Requests

        /// <summary>
        /// GET /api/dashboard/service-requests
        /// Filter service requests using dynamic LINQ conditions
        /// Supports: Status, Priority, Date Range (FromDate, ToDate)
        /// LINQ: Dynamic Where clauses with no raw SQL
        /// </summary>
        [HttpGet("service-requests")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<FilteredServiceRequestDto>>), 200)]
        public async Task<IActionResult> GetFilteredServiceRequests(
            [FromQuery] string? status = null,
            [FromQuery] string? priority = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int? technicianId = null,
            [FromQuery] int? customerId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? vehicleId = null,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var filter = new ServiceRequestFilterDto
            {
                Status = status,
                Priority = priority,
                FromDate = fromDate,
                ToDate = toDate,
                TechnicianId = technicianId,
                CustomerId = customerId,
                CategoryId = categoryId,
                VehicleId = vehicleId,
                PageNumber = pageNumber,
                PageSize = pageSize
            };

            var (items, totalCount) = await _dashboardService.GetFilteredServiceRequestsAsync(filter);

            return Ok(new ApiResponse<PagedResult<FilteredServiceRequestDto>>
            {
                Success = true,
                Message = $"Retrieved {items.Count} service requests using LINQ dynamic filtering",
                Data = new PagedResult<FilteredServiceRequestDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                }
            });
        }

        #endregion

        #region Admin Dashboard

        /// <summary>
        /// GET /api/dashboard/admin
        /// Get admin-specific dashboard data including new users, pending approvals, top categories/parts, low stock
        /// </summary>
        [HttpGet("admin")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<AdminDashboardDto>), 200)]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var adminDashboard = await _dashboardService.GetAdminDashboardAsync();
            return Ok(new ApiResponse<AdminDashboardDto>
            {
                Success = true,
                Message = "Admin dashboard data retrieved successfully",
                Data = adminDashboard
            });
        }

        #endregion
    }
}
