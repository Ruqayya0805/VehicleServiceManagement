using VehicleServiceManagement.API.DTOs.Vehicle;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IVehicleService
    {
        Task<IEnumerable<VehicleDto>> GetAllAsync();
        Task<VehicleDto?> GetByIdAsync(int id);
        Task<IEnumerable<VehicleDto>> GetByCustomerIdAsync(int customerId);
        Task<VehicleDto> CreateAsync(int customerId, CreateVehicleDto dto);
        Task<VehicleDto> UpdateAsync(int id, UpdateVehicleDto dto);
        Task<bool> DeleteAsync(int id);
        Task<VehicleDto?> GetByRegistrationNumberAsync(string registrationNumber);
    }
}
