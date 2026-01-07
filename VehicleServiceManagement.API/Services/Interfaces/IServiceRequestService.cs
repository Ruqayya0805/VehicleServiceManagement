using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServiceRequest;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IServiceRequestService
    {
        Task<IEnumerable<ServiceRequestDto>> GetAllAsync();
        Task<ServiceRequestDto?> GetByIdAsync(int id);
        Task<PagedResult<ServiceRequestDto>> GetFilteredAsync(ServiceRequestFilterDto filter);
        Task<IEnumerable<ServiceRequestDto>> GetByCustomerIdAsync(int customerId);
        Task<IEnumerable<ServiceRequestDto>> GetByTechnicianIdAsync(int technicianId);
        Task<IEnumerable<ServiceRequestDto>> GetByVehicleIdAsync(int vehicleId);
        Task<IEnumerable<ServiceRequestDto>> GetByStatusAsync(string status);
        Task<ServiceRequestDto> CreateAsync(int customerId, CreateServiceRequestDto dto);
        Task<ServiceRequestDto> UpdateAsync(int id, UpdateServiceRequestDto dto);
        Task<bool> DeleteAsync(int id);
        Task<ServiceRequestDto> AssignTechnicianAsync(int id, AssignTechnicianDto dto);
        Task<ServiceRequestDto> UpdateStatusAsync(int id, string status);
        Task<ServiceRequestDto> StartServiceAsync(int id);
        Task<ServiceRequestDto> CompleteServiceAsync(int id, CompleteServiceDto dto);
        Task<ServiceRequestDto> CancelServiceAsync(int id, CancelServiceDto dto);
        Task<ServiceRequestDto> RescheduleAsync(int id, DateTime newDate);
        Task<ServiceRequestDto> AddCustomerRemarksAsync(int id, string remarks);
        Task<ServiceRequestDto> AddTechnicianRemarksAsync(int id, string remarks);
        
        /// <summary>
        /// Unified method to update remarks based on remark type (Customer or Technician)
        /// </summary>
        Task<ServiceRequestDto> UpdateRemarksAsync(int id, string remarkType, string remarks);
    }
}
