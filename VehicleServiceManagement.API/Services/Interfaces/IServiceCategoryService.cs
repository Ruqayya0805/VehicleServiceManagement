using VehicleServiceManagement.API.DTOs.ServiceCategory;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IServiceCategoryService
    {
        Task<IEnumerable<ServiceCategoryDto>> GetAllAsync();
        Task<IEnumerable<ServiceCategoryDto>> GetActiveAsync();
        Task<ServiceCategoryDto?> GetByIdAsync(int id);
        Task<ServiceCategoryDto> CreateAsync(CreateServiceCategoryDto dto);
        Task<ServiceCategoryDto> UpdateAsync(int id, UpdateServiceCategoryDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> ToggleActiveAsync(int id);
    }
}
