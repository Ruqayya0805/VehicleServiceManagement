using VehicleServiceManagement.API.DTOs.User;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAllAsync();
        Task<UserDto?> GetByIdAsync(int id);
        Task<UserDto> CreateAsync(CreateUserDto dto);
        Task<UserDto> UpdateAsync(int id, UpdateUserDto dto);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeactivateAsync(int id);
        Task<bool> ActivateAsync(int id);
        Task<IEnumerable<UserDto>> GetByRoleAsync(string role);
        Task<IEnumerable<TechnicianDto>> GetTechniciansAsync();
        Task<IEnumerable<UserDto>> GetCustomersAsync();
        Task<IEnumerable<UserDto>> GetPendingApprovalsAsync();
        Task<UserDto> ApproveStaffAsync(int id);
        Task<bool> RejectStaffAsync(int id);
    }
}
