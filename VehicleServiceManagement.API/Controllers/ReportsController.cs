using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Reports;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Reports & Dashboard - LINQ Demo (10% of grade)
    /// </summary>
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        /// <summary>
        /// Dashboard statistics - counts by status, today's services, by priority
        /// </summary>
        [HttpGet("dashboard")]
        [ProducesResponseType(typeof(ApiResponse<DashboardReportDto>), 200)]
        public async Task<IActionResult> GetDashboard()
        {
            var report = await _reportService.GetDashboardReportAsync();
            return Ok(new ApiResponse<DashboardReportDto>
            {
                Success = true,
                Message = "Dashboard report generated successfully",
                Data = report
            });
        }

        /// <summary>
        /// Technician workload analysis - assignments grouped by technician
        /// </summary>
        [HttpGet("technician-workload")]
        [ProducesResponseType(typeof(ApiResponse<TechnicianWorkloadReportDto>), 200)]
        public async Task<IActionResult> GetTechnicianWorkload()
        {
            var report = await _reportService.GetTechnicianWorkloadReportAsync();
            return Ok(new ApiResponse<TechnicianWorkloadReportDto>
            {
                Success = true,
                Message = "Technician workload report generated successfully",
                Data = report
            });
        }

        /// <summary>
        /// Monthly revenue report - aggregated revenue by month
        /// </summary>
        [HttpGet("monthly-revenue")]
        [ProducesResponseType(typeof(ApiResponse<MonthlyRevenueReportDto>), 200)]
        public async Task<IActionResult> GetMonthlyRevenue([FromQuery] int? year = null)
        {
            var report = await _reportService.GetMonthlyRevenueReportAsync(year);
            return Ok(new ApiResponse<MonthlyRevenueReportDto>
            {
                Success = true,
                Message = "Monthly revenue report generated successfully",
                Data = report
            });
        }

        /// <summary>
        /// Service statistics - grouped by status, priority, category
        /// </summary>
        [HttpGet("service-statistics")]
        [ProducesResponseType(typeof(ApiResponse<ServiceStatisticsDto>), 200)]
        public async Task<IActionResult> GetServiceStatistics(
            [FromQuery] DateTime? fromDate = null, 
            [FromQuery] DateTime? toDate = null)
        {
            var report = await _reportService.GetServiceStatisticsAsync(fromDate, toDate);
            return Ok(new ApiResponse<ServiceStatisticsDto>
            {
                Success = true,
                Message = "Service statistics report generated successfully",
                Data = report
            });
        }

        /// <summary>
        /// Vehicle service history - all services for a specific vehicle
        /// </summary>
        [HttpGet("vehicle-history/{vehicleId}")]
        [ProducesResponseType(typeof(ApiResponse<VehicleServiceHistoryDto>), 200)]
        public async Task<IActionResult> GetVehicleServiceHistory(int vehicleId)
        {
            var report = await _reportService.GetVehicleServiceHistoryAsync(vehicleId);
            return Ok(new ApiResponse<VehicleServiceHistoryDto>
            {
                Success = true,
                Message = "Vehicle service history retrieved successfully",
                Data = report
            });
        }
    }
}
