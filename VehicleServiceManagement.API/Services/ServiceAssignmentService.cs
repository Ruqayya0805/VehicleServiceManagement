using VehicleServiceManagement.API.DTOs.ServiceAssignment;
using VehicleServiceManagement.API.DTOs.ServiceTask;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class ServiceAssignmentService : IServiceAssignmentService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly NotificationTriggerService _notificationTrigger;

        public ServiceAssignmentService(IUnitOfWork unitOfWork, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _notificationTrigger = notificationTrigger;
        }

        public async Task<IEnumerable<ServiceAssignmentDto>> GetAllAsync()
        {
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            return await MapToDtos(assignments);
        }

        public async Task<ServiceAssignmentDto?> GetByIdAsync(int id)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            if (assignment == null) return null;

            return (await MapToDtos(new[] { assignment })).FirstOrDefault();
        }

        public async Task<ServiceAssignmentDto?> GetByServiceRequestIdAsync(int serviceRequestId)
        {
            var assignments = await _unitOfWork.ServiceAssignments.FindAsync(a => a.ServiceRequestId == serviceRequestId);
            var assignment = assignments.FirstOrDefault();
            if (assignment == null) return null;

            return (await MapToDtos(new[] { assignment })).FirstOrDefault();
        }

        public async Task<IEnumerable<ServiceAssignmentDto>> GetByTechnicianIdAsync(int technicianId)
        {
            var assignments = await _unitOfWork.ServiceAssignments.FindAsync(a => a.TechnicianId == technicianId);
            return await MapToDtos(assignments.OrderByDescending(a => a.AssignedDate));
        }

        public async Task<IEnumerable<ServiceAssignmentDto>> GetPendingByTechnicianIdAsync(int technicianId)
        {
            var assignments = await _unitOfWork.ServiceAssignments.FindAsync(a => 
                a.TechnicianId == technicianId && 
                (a.Status == "Assigned" || a.Status == "InProgress"));
            return await MapToDtos(assignments.OrderByDescending(a => a.AssignedDate));
        }

        public async Task<ServiceAssignmentDto> CreateAsync(CreateServiceAssignmentDto dto)
        {
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(dto.ServiceRequestId);
            if (serviceRequest == null)
            {
                throw new NotFoundException("ServiceRequest", dto.ServiceRequestId);
            }

            if (serviceRequest.Status != ServiceStatus.Requested)
            {
                throw new BadRequestException("Can only assign technicians to service requests in 'Requested' status");
            }
            var technician = await _unitOfWork.Users.GetByIdAsync(dto.TechnicianId);
            if (technician == null || technician.Role != UserRole.Technician)
            {
                throw new BadRequestException("Invalid technician");
            }
            if (await _unitOfWork.ServiceAssignments.ExistsAsync(a => a.ServiceRequestId == dto.ServiceRequestId))
            {
                throw new ConflictException("An assignment already exists for this service request");
            }

            var assignment = new ServiceAssignment
            {
                ServiceRequestId = dto.ServiceRequestId,
                TechnicianId = dto.TechnicianId,
                AssignedDate = DateTime.UtcNow,
                Status = "Assigned",
                Notes = dto.Notes
            };

            await _unitOfWork.ServiceAssignments.AddAsync(assignment);
            serviceRequest.Status = ServiceStatus.Assigned;
            await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);

            await _unitOfWork.SaveChangesAsync();
            try
            {
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(serviceRequest.VehicleId);
                var customer = await _unitOfWork.Users.GetByIdAsync(serviceRequest.CustomerId);
                if (vehicle != null)
                {
                    await _notificationTrigger.NotifyTechnicianAssignedAsync(serviceRequest, technician, vehicle, null);
                }
                if (customer != null && vehicle != null)
                {
                    await _notificationTrigger.NotifyCustomerTechnicianAssignedAsync(serviceRequest, customer, technician, vehicle);
                }
            }
            catch {  }

            return (await MapToDtos(new[] { assignment })).First();
        }

        public async Task<ServiceAssignmentDto> UpdateAsync(int id, UpdateServiceAssignmentDto dto)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (dto.TechnicianId.HasValue)
            {
                var technician = await _unitOfWork.Users.GetByIdAsync(dto.TechnicianId.Value);
                if (technician == null || technician.Role != UserRole.Technician)
                {
                    throw new BadRequestException("Invalid technician");
                }
                assignment.TechnicianId = dto.TechnicianId.Value;
            }

            if (dto.Status != null) assignment.Status = dto.Status;
            if (dto.Notes != null) assignment.Notes = dto.Notes;

            await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { assignment })).First();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (assignment.Status == "Completed")
            {
                throw new BadRequestException("Cannot delete a completed assignment");
            }
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(assignment.ServiceRequestId);
            if (serviceRequest != null)
            {
                serviceRequest.Status = ServiceStatus.Requested;
                await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
            }

            await _unitOfWork.ServiceAssignments.DeleteAsync(assignment);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<ServiceAssignmentDto> StartAsync(int id, StartAssignmentDto dto)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (assignment.Status != "Assigned")
            {
                throw new BadRequestException("Can only start assignments in 'Assigned' status");
            }

            assignment.Status = "InProgress";
            assignment.StartedDate = DateTime.UtcNow;
            if (dto.Notes != null) assignment.Notes = dto.Notes;

            await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(assignment.ServiceRequestId);
            if (serviceRequest != null)
            {
                serviceRequest.Status = ServiceStatus.InProgress;
                await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
            }

            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { assignment })).First();
        }

        public async Task<ServiceAssignmentDto> CompleteAsync(int id, CompleteAssignmentDto dto)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (assignment.Status != "InProgress")
            {
                throw new BadRequestException("Can only complete assignments in 'InProgress' status");
            }

            assignment.Status = "Completed";
            assignment.CompletedDate = DateTime.UtcNow;
            if (dto.Notes != null) assignment.Notes = dto.Notes;

            await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(assignment.ServiceRequestId);
            if (serviceRequest != null)
            {
                serviceRequest.Status = ServiceStatus.Completed;
                serviceRequest.CompletedDate = DateTime.UtcNow;
                await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
            }

            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { assignment })).First();
        }

        public async Task<ServiceAssignmentDto> ReassignAsync(int id, int newTechnicianId, string? notes = null)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (assignment.Status == "Completed")
            {
                throw new BadRequestException("Cannot reassign a completed assignment");
            }
            var technician = await _unitOfWork.Users.GetByIdAsync(newTechnicianId);
            if (technician == null || technician.Role != UserRole.Technician)
            {
                throw new BadRequestException("Invalid technician");
            }

            assignment.TechnicianId = newTechnicianId;
            assignment.AssignedDate = DateTime.UtcNow;
            assignment.StartedDate = null;
            assignment.Status = "Assigned";
            if (notes != null) assignment.Notes = notes;

            await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(assignment.ServiceRequestId);
            if (serviceRequest != null && serviceRequest.Status == ServiceStatus.InProgress)
            {
                serviceRequest.Status = ServiceStatus.Assigned;
                await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
            }

            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { assignment })).First();
        }

        /// <summary>
        /// Get assignments with optional filtering by technician, status, date range, etc.
        /// </summary>
        public async Task<IEnumerable<ServiceAssignmentDto>> GetFilteredAsync(ServiceAssignmentFilterDto filter)
        {
            var allAssignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var query = allAssignments.AsQueryable();
            if (filter.TechnicianId.HasValue)
                query = query.Where(a => a.TechnicianId == filter.TechnicianId.Value);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(a => a.Status == filter.Status);

            if (filter.ServiceRequestId.HasValue)
                query = query.Where(a => a.ServiceRequestId == filter.ServiceRequestId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(a => a.AssignedDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(a => a.AssignedDate <= filter.ToDate.Value);

            var filteredAssignments = query.OrderByDescending(a => a.AssignedDate).ToList();
            return await MapToDtos(filteredAssignments);
        }

        /// <summary>
        /// Unified method to update assignment status (InProgress, Completed, or Reopen) with business logic
        /// </summary>
        public async Task<ServiceAssignmentDto> UpdateStatusAsync(int id, string status, string? notes = null)
        {
            if (status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
            {
                return await StartAsync(id, new StartAssignmentDto { Notes = notes });
            }
            else if (status.Equals("Completed", StringComparison.OrdinalIgnoreCase))
            {
                return await CompleteAsync(id, new CompleteAssignmentDto { Notes = notes });
            }
            else if (status.Equals("Reopen", StringComparison.OrdinalIgnoreCase))
            {
                return await ReopenAsync(id, notes);
            }
            else
            {
                throw new BadRequestException("Status must be 'InProgress', 'Completed', or 'Reopen'");
            }
        }

        /// <summary>
        /// Reopen a completed assignment (only if service request is not yet closed)
        /// </summary>
        public async Task<ServiceAssignmentDto> ReopenAsync(int id, string? notes = null)
        {
            var assignment = await _unitOfWork.ServiceAssignments.GetByIdAsync(id);
            
            if (assignment == null)
            {
                throw new NotFoundException("ServiceAssignment", id);
            }

            if (assignment.Status != "Completed")
            {
                throw new BadRequestException("Can only reopen assignments in 'Completed' status");
            }
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(assignment.ServiceRequestId);
            if (serviceRequest == null)
            {
                throw new NotFoundException("ServiceRequest", assignment.ServiceRequestId);
            }

            if (serviceRequest.Status == ServiceStatus.Closed)
            {
                throw new BadRequestException("Cannot reopen assignment - service request has been closed by the service manager");
            }
            assignment.Status = "InProgress";
            assignment.CompletedDate = null;
            if (notes != null) assignment.Notes = notes;

            await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            serviceRequest.Status = ServiceStatus.InProgress;
            serviceRequest.CompletedDate = null;
            await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);

            await _unitOfWork.SaveChangesAsync();
            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(serviceRequest.CustomerId);
                var technician = await _unitOfWork.Users.GetByIdAsync(assignment.TechnicianId);
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(serviceRequest.VehicleId);
                
                if (customer != null && technician != null && vehicle != null)
                {
                    await _notificationTrigger.NotifyServiceReopenedAsync(serviceRequest, customer, technician, vehicle);
                }
            }
            catch {  }

            return (await MapToDtos(new[] { assignment })).First();
        }

        private async Task<IEnumerable<ServiceAssignmentDto>> MapToDtos(IEnumerable<ServiceAssignment> assignments)
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var serviceRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var serviceRequestCategories = await _unitOfWork.ServiceRequestCategories.GetAllAsync();
            var serviceTasks = await _unitOfWork.ServiceTasks.GetAllAsync();

            return assignments.Select(a =>
            {
                var technician = users.FirstOrDefault(u => u.UserId == a.TechnicianId);
                var serviceRequest = serviceRequests.FirstOrDefault(sr => sr.ServiceRequestId == a.ServiceRequestId);
                var customer = serviceRequest != null 
                    ? users.FirstOrDefault(u => u.UserId == serviceRequest.CustomerId) 
                    : null;
                var vehicle = serviceRequest != null 
                    ? vehicles.FirstOrDefault(v => v.VehicleId == serviceRequest.VehicleId) 
                    : null;
                var bill = bills.FirstOrDefault(b => b.ServiceRequestId == a.ServiceRequestId);
                string serviceDescription = "";
                if (serviceRequest != null)
                {
                    var srCategories = serviceRequestCategories
                        .Where(src => src.ServiceRequestId == serviceRequest.ServiceRequestId)
                        .Select(src => categories.FirstOrDefault(c => c.CategoryId == src.CategoryId)?.CategoryName)
                        .Where(name => name != null)
                        .ToList();
                    
                    if (srCategories.Any())
                    {
                        serviceDescription = string.Join(", ", srCategories);
                    }
                    else if (serviceRequest.CategoryId.HasValue)
                    {
                        var cat = categories.FirstOrDefault(c => c.CategoryId == serviceRequest.CategoryId);
                        serviceDescription = cat?.CategoryName ?? "";
                    }
                }
                var tasks = serviceTasks
                    .Where(t => t.ServiceRequestId == a.ServiceRequestId)
                    .OrderBy(t => t.OrderIndex)
                    .Select(t => new ServiceTaskDto
                    {
                        ServiceTaskId = t.ServiceTaskId,
                        ServiceRequestId = t.ServiceRequestId,
                        Description = t.Description,
                        IsCompleted = t.IsCompleted,
                        CompletedDate = t.CompletedDate,
                        CompletedByUserId = t.CompletedByUserId,
                        CompletedByName = t.CompletedByUserId.HasValue 
                            ? users.FirstOrDefault(u => u.UserId == t.CompletedByUserId)?.FirstName + " " + 
                              users.FirstOrDefault(u => u.UserId == t.CompletedByUserId)?.LastName 
                            : null,
                        Price = t.Price,
                        OrderIndex = t.OrderIndex
                    })
                    .ToList();

                return new ServiceAssignmentDto
                {
                    AssignmentId = a.AssignmentId,
                    ServiceRequestId = a.ServiceRequestId,
                    ServiceDescription = !string.IsNullOrEmpty(serviceDescription) ? serviceDescription : "Custom Issue",
                    IssueDescription = serviceRequest?.IssueDescription,
                    VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model} ({vehicle.RegistrationNumber})" : "Unknown",
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                    TechnicianId = a.TechnicianId,
                    TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : "Unknown",
                    AssignedDate = a.AssignedDate,
                    StartedDate = a.StartedDate,
                    CompletedDate = a.CompletedDate,
                    Status = a.Status,
                    Notes = a.Notes,
                    Priority = serviceRequest?.Priority ?? "Normal",
                    HasBill = bill != null,
                    BillId = bill?.BillId,
                    IsClosed = serviceRequest?.Status == "Closed",
                    Tasks = tasks
                };
            });
        }
    }
}
