using VehicleServiceManagement.API.DTOs.ServiceAssignment;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IServiceAssignmentService
    {
        Task<IEnumerable<ServiceAssignmentDto>> GetAllAsync();
        Task<ServiceAssignmentDto?> GetByIdAsync(int id);
        Task<ServiceAssignmentDto?> GetByServiceRequestIdAsync(int serviceRequestId);
        Task<IEnumerable<ServiceAssignmentDto>> GetByTechnicianIdAsync(int technicianId);
        Task<IEnumerable<ServiceAssignmentDto>> GetPendingByTechnicianIdAsync(int technicianId);
        
        /// <summary>
        /// Get assignments with optional filtering by technician, status, date range, etc.
        /// </summary>
        Task<IEnumerable<ServiceAssignmentDto>> GetFilteredAsync(ServiceAssignmentFilterDto filter);
        
        Task<ServiceAssignmentDto> CreateAsync(CreateServiceAssignmentDto dto);
        Task<ServiceAssignmentDto> UpdateAsync(int id, UpdateServiceAssignmentDto dto);
        Task<bool> DeleteAsync(int id);
        Task<ServiceAssignmentDto> StartAsync(int id, StartAssignmentDto dto);
        Task<ServiceAssignmentDto> CompleteAsync(int id, CompleteAssignmentDto dto);
        Task<ServiceAssignmentDto> ReassignAsync(int id, int newTechnicianId, string? notes = null);
        
        /// <summary>
        /// Unified method to update assignment status (InProgress, Completed, or Reopen) with business logic
        /// </summary>
        Task<ServiceAssignmentDto> UpdateStatusAsync(int id, string status, string? notes = null);
        
        /// <summary>
        /// Reopen a completed assignment (only if service request is not yet closed)
        /// </summary>
        Task<ServiceAssignmentDto> ReopenAsync(int id, string? notes = null);
    }
}
