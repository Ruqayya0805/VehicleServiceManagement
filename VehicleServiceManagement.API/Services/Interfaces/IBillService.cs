using VehicleServiceManagement.API.DTOs.Bill;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IBillService
    {
        Task<IEnumerable<BillDto>> GetAllAsync();
        Task<BillDto?> GetByIdAsync(int id);
        Task<BillDto?> GetByServiceRequestIdAsync(int serviceRequestId);
        Task<IEnumerable<BillSummaryDto>> GetByCustomerIdAsync(int customerId);
        Task<IEnumerable<BillSummaryDto>> GetUnpaidAsync();
        Task<IEnumerable<BillSummaryDto>> GetOverdueAsync();
        
        /// <summary>
        /// Get bills with optional filtering by serviceRequestId, customerId, paymentStatus, date range, etc.
        /// </summary>
        Task<IEnumerable<BillSummaryDto>> GetFilteredAsync(BillFilterDto filter);
        
        Task<BillDto> GenerateAsync(GenerateBillDto dto);
        Task<BillDto> UpdateAsync(int id, UpdateBillDto dto);
        Task<bool> DeleteAsync(int id);
        Task<BillDto> RecalculateAsync(int id);
    }
}
