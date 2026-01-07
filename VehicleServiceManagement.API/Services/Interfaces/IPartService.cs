using VehicleServiceManagement.API.DTOs.Part;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IPartService
    {
        Task<IEnumerable<PartDto>> GetAllAsync();
        Task<PartDto?> GetByIdAsync(int id);
        Task<PartDto?> GetByPartNumberAsync(string partNumber);
        Task<IEnumerable<LowStockPartDto>> GetLowStockAsync();
        Task<PartDto> CreateAsync(CreatePartDto dto);
        Task<PartDto> UpdateAsync(int id, UpdatePartDto dto);
        Task<bool> DeleteAsync(int id);
        Task<PartDto> RestockAsync(int id, RestockPartDto dto);
        Task<bool> DeductStockAsync(int partId, int quantity);
        Task<bool> CheckAvailabilityAsync(int partId, int quantity);
    }
}
