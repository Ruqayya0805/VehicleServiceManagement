using VehicleServiceManagement.API.DTOs.ServicePart;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IServicePartService
    {
        Task<IEnumerable<ServicePartDto>> GetAllAsync();
        Task<ServicePartDto?> GetByIdAsync(int id);
        Task<IEnumerable<ServicePartDto>> GetByServiceRequestIdAsync(int serviceRequestId);
        Task<ServicePartDto> AddPartToServiceAsync(CreateServicePartDto dto);
        Task<ServicePartDto> UpdateAsync(int id, UpdateServicePartDto dto);
        Task<bool> RemoveAsync(int id);
        Task<decimal> GetTotalPartsChargeAsync(int serviceRequestId);
    }
}
