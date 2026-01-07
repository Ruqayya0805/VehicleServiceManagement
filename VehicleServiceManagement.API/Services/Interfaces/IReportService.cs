using VehicleServiceManagement.API.DTOs.Reports;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IReportService
    {
        Task<DashboardReportDto> GetDashboardReportAsync();
        Task<TechnicianWorkloadReportDto> GetTechnicianWorkloadReportAsync();
        Task<MonthlyRevenueReportDto> GetMonthlyRevenueReportAsync(int? year = null);
        Task<VehicleServiceHistoryDto> GetVehicleServiceHistoryAsync(int vehicleId);
        Task<ServiceStatisticsDto> GetServiceStatisticsAsync(DateTime? fromDate = null, DateTime? toDate = null);
    }
}
