using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.DTOs.ServiceRequest;
using VehicleServiceManagement.API.DTOs.ServiceTask;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Exceptions;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Repositories;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class ServiceRequestService : IServiceRequestService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly NotificationTriggerService _notificationTrigger;

        public ServiceRequestService(IUnitOfWork unitOfWork, NotificationTriggerService notificationTrigger)
        {
            _unitOfWork = unitOfWork;
            _notificationTrigger = notificationTrigger;
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetAllAsync()
        {
            var requests = await _unitOfWork.ServiceRequests.GetAllAsync();
            return await MapToDtos(requests);
        }

        public async Task<ServiceRequestDto?> GetByIdAsync(int id)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            if (request == null) return null;

            return (await MapToDtos(new[] { request })).FirstOrDefault();
        }

        public async Task<PagedResult<ServiceRequestDto>> GetFilteredAsync(ServiceRequestFilterDto filter)
        {
            var allRequests = await _unitOfWork.ServiceRequests.GetAllAsync();
            var query = allRequests.AsQueryable();

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(r => r.Status == filter.Status);

            if (!string.IsNullOrEmpty(filter.Priority))
                query = query.Where(r => r.Priority == filter.Priority);

            if (filter.CustomerId.HasValue)
                query = query.Where(r => r.CustomerId == filter.CustomerId.Value);

            if (filter.CategoryId.HasValue)
                query = query.Where(r => r.CategoryId == filter.CategoryId.Value);

            if (filter.VehicleId.HasValue)
                query = query.Where(r => r.VehicleId == filter.VehicleId.Value);

            if (filter.FromDate.HasValue)
                query = query.Where(r => r.RequestedDate >= filter.FromDate.Value);

            if (filter.ToDate.HasValue)
                query = query.Where(r => r.RequestedDate <= filter.ToDate.Value);

            if (filter.TechnicianId.HasValue)
            {
                var assignments = await _unitOfWork.ServiceAssignments.FindAsync(a => a.TechnicianId == filter.TechnicianId.Value);
                var assignedRequestIds = assignments.Select(a => a.ServiceRequestId).ToList();
                query = query.Where(r => assignedRequestIds.Contains(r.ServiceRequestId));
            }

            var totalCount = query.Count();
            var pagedRequests = query
                .OrderByDescending(r => r.RequestedDate)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToList();

            var dtos = await MapToDtos(pagedRequests);

            return new PagedResult<ServiceRequestDto>
            {
                Items = dtos.ToList(),
                TotalCount = totalCount,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetByCustomerIdAsync(int customerId)
        {
            var requests = await _unitOfWork.ServiceRequests.FindAsync(r => r.CustomerId == customerId);
            return await MapToDtos(requests.OrderByDescending(r => r.RequestedDate));
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetByTechnicianIdAsync(int technicianId)
        {
            var assignments = await _unitOfWork.ServiceAssignments.FindAsync(a => a.TechnicianId == technicianId);
            var requestIds = assignments.Select(a => a.ServiceRequestId).ToList();
            var requests = await _unitOfWork.ServiceRequests.FindAsync(r => requestIds.Contains(r.ServiceRequestId));
            return await MapToDtos(requests.OrderByDescending(r => r.RequestedDate));
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetByVehicleIdAsync(int vehicleId)
        {
            var requests = await _unitOfWork.ServiceRequests.FindAsync(r => r.VehicleId == vehicleId);
            return await MapToDtos(requests.OrderByDescending(r => r.RequestedDate));
        }

        public async Task<IEnumerable<ServiceRequestDto>> GetByStatusAsync(string status)
        {
            var requests = await _unitOfWork.ServiceRequests.FindAsync(r => r.Status == status);
            return await MapToDtos(requests.OrderByDescending(r => r.RequestedDate));
        }

        public async Task<ServiceRequestDto> CreateAsync(int customerId, CreateServiceRequestDto dto)
        {
            var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(dto.VehicleId);
            if (vehicle == null)
            {
                throw new NotFoundException("Vehicle", dto.VehicleId);
            }

            if (vehicle.CustomerId != customerId)
            {
                throw new ForbiddenException("You can only create service requests for your own vehicles");
            }

            var categoryIds = new List<int>();
            if (dto.CategoryIds != null && dto.CategoryIds.Any())
            {
                categoryIds.AddRange(dto.CategoryIds);
            }
            else if (dto.CategoryId.HasValue)
            {
                categoryIds.Add(dto.CategoryId.Value);
            }

            var selectedCategories = new List<ServiceCategory>();
            decimal totalEstimatedCost = 0;

            if (categoryIds.Any())
            {
                var allCategories = await _unitOfWork.ServiceCategories.GetAllAsync();
                selectedCategories = allCategories.Where(c => categoryIds.Contains(c.CategoryId)).ToList();
                
                if (selectedCategories.Count != categoryIds.Count)
                {
                    throw new BadRequestException("One or more selected service categories are invalid");
                }

                var inactiveCategories = selectedCategories.Where(c => !c.IsActive).ToList();
                if (inactiveCategories.Any())
                {
                    throw new BadRequestException($"The following categories are not active: {string.Join(", ", inactiveCategories.Select(c => c.CategoryName))}");
                }

                totalEstimatedCost = selectedCategories.Sum(c => c.BasePrice);
            }

            if (dto.Priority == ServicePriority.Urgent)
            {
                totalEstimatedCost *= 1.5m;
            }

            var serviceRequest = new ServiceRequest
            {
                VehicleId = dto.VehicleId,
                CustomerId = customerId,
                CategoryId = selectedCategories.FirstOrDefault()?.CategoryId,
                IssueDescription = dto.IssueDescription,
                Priority = dto.Priority ?? ServicePriority.Normal,
                Status = ServiceStatus.Requested,
                RequestedDate = DateTime.UtcNow,
                ScheduledDate = dto.ScheduledDate,
                CustomerRemarks = dto.CustomerRemarks,
                EstimatedCost = totalEstimatedCost
            };

            if (selectedCategories.Any())
            {
                foreach (var category in selectedCategories)
                {
                    serviceRequest.ServiceRequestCategories.Add(new ServiceRequestCategory
                    {
                        CategoryId = category.CategoryId
                    });
                }
            }

            var taskDescriptions = dto.IssueDescription
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .ToList();

            for (int i = 0; i < taskDescriptions.Count; i++)
            {
                serviceRequest.ServiceTasks.Add(new ServiceTask
                {
                    Description = taskDescriptions[i].Trim(),
                    OrderIndex = i,
                    IsCompleted = false,
                    CreatedDate = DateTime.UtcNow
                });
            }

            await _unitOfWork.ServiceRequests.AddAsync(serviceRequest);
            await _unitOfWork.SaveChangesAsync();

            try 
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(customerId);
                if (customer != null)
                {
                    await _notificationTrigger.NotifyServiceRequestCreatedAsync(serviceRequest, vehicle, customer);
                }
            }
            catch { }

            return (await MapToDtos(new[] { serviceRequest })).First();
        }

        public async Task<ServiceRequestDto> UpdateAsync(int id, UpdateServiceRequestDto dto)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (dto.Status != null) request.Status = dto.Status;
            if (dto.ScheduledDate.HasValue) request.ScheduledDate = dto.ScheduledDate.Value;
            if (dto.TechnicianRemarks != null) request.TechnicianRemarks = dto.TechnicianRemarks;
            if (dto.CustomerRemarks != null) request.CustomerRemarks = dto.CustomerRemarks;
            if (dto.ActualCost.HasValue) request.ActualCost = dto.ActualCost.Value;
            if (dto.Priority != null) request.Priority = dto.Priority;
            
            if (dto.CategoryId.HasValue)
            {
                var category = await _unitOfWork.ServiceCategories.GetByIdAsync(dto.CategoryId.Value);
                if (category == null)
                {
                    throw new NotFoundException("ServiceCategory", dto.CategoryId.Value);
                }
                request.CategoryId = dto.CategoryId.Value;
            }

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status != ServiceStatus.Requested && request.Status != ServiceStatus.Cancelled)
            {
                throw new BadRequestException("Can only delete service requests in 'Requested' or 'Cancelled' status");
            }

            await _unitOfWork.ServiceRequests.DeleteAsync(request);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<ServiceRequestDto> AssignTechnicianAsync(int id, AssignTechnicianDto dto)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status != ServiceStatus.Requested)
            {
                throw new BadRequestException("Can only assign technician to requests in 'Requested' status");
            }

            var technician = await _unitOfWork.Users.GetByIdAsync(dto.TechnicianId);
            if (technician == null || technician.Role != UserRole.Technician)
            {
                throw new BadRequestException("Invalid technician");
            }

            var existingAssignment = (await _unitOfWork.ServiceAssignments
                .FindAsync(a => a.ServiceRequestId == id)).FirstOrDefault();
            
            if (existingAssignment != null)
            {
                throw new ConflictException("An assignment already exists for this service request");
            }

            var assignment = new ServiceAssignment
            {
                ServiceRequestId = id,
                TechnicianId = dto.TechnicianId,
                AssignedDate = DateTime.UtcNow,
                Status = "Assigned",
                Notes = dto.Notes
            };

            await _unitOfWork.ServiceAssignments.AddAsync(assignment);

            request.Status = ServiceStatus.Assigned;
            if (dto.ScheduledDate.HasValue)
            {
                request.ScheduledDate = dto.ScheduledDate.Value;
            }

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();

            try
            {
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                
                await _notificationTrigger.NotifyTechnicianAssignedAsync(request, technician, vehicle, null);
                
                if (customer != null && vehicle != null)
                {
                    await _notificationTrigger.NotifyCustomerTechnicianAssignedAsync(request, customer, technician, vehicle);
                }
            }
            catch { }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> UpdateStatusAsync(int id, string status)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            var validStatuses = new[] { 
                ServiceStatus.Requested, ServiceStatus.Assigned, 
                ServiceStatus.InProgress, ServiceStatus.Completed, 
                ServiceStatus.Closed, ServiceStatus.Cancelled 
            };
            
            if (!validStatuses.Contains(status))
            {
                throw new BadRequestException($"Invalid status. Valid statuses are: {string.Join(", ", validStatuses)}");
            }

            request.Status = status;
            
            if (status == ServiceStatus.Completed)
            {
                request.CompletedDate = DateTime.UtcNow;
            }

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();

            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                if (customer != null)
                {
                    await _notificationTrigger.NotifyServiceStatusChangedAsync(request, customer, status, null);
                }
            }
            catch { }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> StartServiceAsync(int id)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status != ServiceStatus.Assigned)
            {
                throw new BadRequestException("Can only start service that is in 'Assigned' status");
            }

            request.Status = ServiceStatus.InProgress;
            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            var assignment = (await _unitOfWork.ServiceAssignments
                .FindAsync(a => a.ServiceRequestId == id)).FirstOrDefault();
            
            if (assignment != null)
            {
                assignment.StartedDate = DateTime.UtcNow;
                assignment.Status = "InProgress";
                await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            }

            await _unitOfWork.SaveChangesAsync();

            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                if (customer != null)
                {
                    var technicianId = assignment?.TechnicianId;
                    await _notificationTrigger.NotifyCustomerWorkStartedAsync(request, customer, technicianId);
                }
            }
            catch { }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> CompleteServiceAsync(int id, CompleteServiceDto dto)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status != ServiceStatus.InProgress)
            {
                throw new BadRequestException("Can only complete service that is 'InProgress'");
            }

            request.Status = ServiceStatus.Completed;
            request.CompletedDate = DateTime.UtcNow;
            
            if (dto.TechnicianRemarks != null)
            {
                request.TechnicianRemarks = dto.TechnicianRemarks;
            }
            
            if (dto.ActualCost.HasValue)
            {
                request.ActualCost = dto.ActualCost.Value;
            }

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            var assignment = (await _unitOfWork.ServiceAssignments
                .FindAsync(a => a.ServiceRequestId == id)).FirstOrDefault();
            
            if (assignment != null)
            {
                assignment.CompletedDate = DateTime.UtcNow;
                assignment.Status = "Completed";
                await _unitOfWork.ServiceAssignments.UpdateAsync(assignment);
            }

            await _unitOfWork.SaveChangesAsync();
            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);
                if (customer != null)
                {
                    await _notificationTrigger.NotifyServiceCompletedAsync(request, customer, null);
                }
                if (assignment != null && vehicle != null)
                {
                    var technician = await _unitOfWork.Users.GetByIdAsync(assignment.TechnicianId);
                    if (technician != null)
                    {
                        await _notificationTrigger.NotifyManagerWorkCompletedAsync(request, technician, vehicle);
                    }
                }
            }
            catch {  }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> CancelServiceAsync(int id, CancelServiceDto dto)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status == ServiceStatus.Completed || request.Status == ServiceStatus.Closed)
            {
                throw new BadRequestException("Cannot cancel a completed or closed service request");
            }

            request.Status = ServiceStatus.Cancelled;
            request.CustomerRemarks = $"Cancelled: {dto.Reason}";

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();
            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);
                if (customer != null && vehicle != null)
                {
                    await _notificationTrigger.NotifyManagerServiceCancelledAsync(request, customer, vehicle, dto.Reason);
                }
            }
            catch {  }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> RescheduleAsync(int id, DateTime newDate)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            if (request.Status == ServiceStatus.Completed || request.Status == ServiceStatus.Closed)
            {
                throw new BadRequestException("Cannot reschedule a completed or closed service request");
            }

            if (newDate < DateTime.UtcNow)
            {
                throw new BadRequestException("Cannot schedule a service request in the past");
            }

            request.ScheduledDate = newDate;
            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();
            try
            {
                var customer = await _unitOfWork.Users.GetByIdAsync(request.CustomerId);
                var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(request.VehicleId);
                if (customer != null && vehicle != null)
                {
                    await _notificationTrigger.NotifyManagerServiceRescheduledAsync(request, customer, vehicle, newDate);
                }
            }
            catch {  }

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> AddCustomerRemarksAsync(int id, string remarks)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            request.CustomerRemarks = string.IsNullOrEmpty(request.CustomerRemarks) 
                ? remarks 
                : $"{request.CustomerRemarks}\n{remarks}";

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { request })).First();
        }

        public async Task<ServiceRequestDto> AddTechnicianRemarksAsync(int id, string remarks)
        {
            var request = await _unitOfWork.ServiceRequests.GetByIdAsync(id);
            
            if (request == null)
            {
                throw new NotFoundException("ServiceRequest", id);
            }

            request.TechnicianRemarks = string.IsNullOrEmpty(request.TechnicianRemarks) 
                ? remarks 
                : $"{request.TechnicianRemarks}\n{remarks}";

            await _unitOfWork.ServiceRequests.UpdateAsync(request);
            await _unitOfWork.SaveChangesAsync();

            return (await MapToDtos(new[] { request })).First();
        }

        /// <summary>
        /// Unified method to update remarks based on remark type (Customer or Technician)
        /// </summary>
        public async Task<ServiceRequestDto> UpdateRemarksAsync(int id, string remarkType, string remarks)
        {
            if (remarkType.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                return await AddCustomerRemarksAsync(id, remarks);
            }
            else if (remarkType.Equals("Technician", StringComparison.OrdinalIgnoreCase))
            {
                return await AddTechnicianRemarksAsync(id, remarks);
            }
            else
            {
                throw new BadRequestException("RemarkType must be either 'Customer' or 'Technician'");
            }
        }

        private async Task<IEnumerable<ServiceRequestDto>> MapToDtos(IEnumerable<ServiceRequest> requests)
        {
            var users = await _unitOfWork.Users.GetAllAsync();
            var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
            var categories = await _unitOfWork.ServiceCategories.GetAllAsync();
            var assignments = await _unitOfWork.ServiceAssignments.GetAllAsync();
            var bills = await _unitOfWork.Bills.GetAllAsync();
            var mappings = await _unitOfWork.ServiceRequestCategories.GetAllAsync();
            var allTasks = await _unitOfWork.ServiceTasks.GetAllAsync();

            return requests.Select(r =>
            {
                var requestMappings = mappings.Where(m => m.ServiceRequestId == r.ServiceRequestId).ToList();
                var customer = users.FirstOrDefault(u => u.UserId == r.CustomerId);
                var vehicle = vehicles.FirstOrDefault(v => v.VehicleId == r.VehicleId);
                var category = categories.FirstOrDefault(c => c.CategoryId == r.CategoryId);
                var assignment = assignments.FirstOrDefault(a => a.ServiceRequestId == r.ServiceRequestId);
                var technician = assignment != null 
                    ? users.FirstOrDefault(u => u.UserId == assignment.TechnicianId) 
                    : null;
                var hasBill = bills.Any(b => b.ServiceRequestId == r.ServiceRequestId);
                var requestTasks = allTasks
                    .Where(t => t.ServiceRequestId == r.ServiceRequestId)
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
                    }).ToList();
                List<ServiceCategoryInfoDto> selectedServices;
                if (requestMappings.Any())
                {
                    selectedServices = requestMappings.Select(sc => new ServiceCategoryInfoDto
                    {
                        CategoryId = sc.CategoryId,
                        CategoryName = categories.FirstOrDefault(c => c.CategoryId == sc.CategoryId)?.CategoryName ?? "Unknown",
                        BasePrice = categories.FirstOrDefault(c => c.CategoryId == sc.CategoryId)?.BasePrice ?? 0
                    }).ToList();
                }
                else if (category != null)
                {
                    selectedServices = new List<ServiceCategoryInfoDto>
                    {
                        new ServiceCategoryInfoDto
                        {
                            CategoryId = category.CategoryId,
                            CategoryName = category.CategoryName,
                            BasePrice = category.BasePrice
                        }
                    };
                }
                else
                {
                    selectedServices = new List<ServiceCategoryInfoDto>();
                }

                return new ServiceRequestDto
                {
                    ServiceRequestId = r.ServiceRequestId,
                    VehicleId = r.VehicleId,
                    VehicleInfo = vehicle != null ? $"{vehicle.Make} {vehicle.Model} ({vehicle.Year})" : "Unknown",
                    RegistrationNumber = vehicle?.RegistrationNumber ?? "Unknown",
                    CustomerId = r.CustomerId,
                    CustomerName = customer != null ? $"{customer.FirstName} {customer.LastName}" : "Unknown",
                    CategoryId = r.CategoryId,
                    CategoryName = category?.CategoryName,
                    SelectedServices = selectedServices,
                    Tasks = requestTasks,
                    IssueDescription = r.IssueDescription,
                    Priority = r.Priority,
                    Status = r.Status,
                    RequestedDate = r.RequestedDate,
                    ScheduledDate = r.ScheduledDate,
                    CompletedDate = r.CompletedDate,
                    CustomerRemarks = r.CustomerRemarks,
                    TechnicianRemarks = r.TechnicianRemarks,
                    EstimatedCost = r.EstimatedCost,
                    ActualCost = r.ActualCost,
                    HasBill = hasBill,
                    Assignment = assignment != null ? new ServiceAssignmentInfoDto
                    {
                        AssignmentId = assignment.AssignmentId,
                        TechnicianId = assignment.TechnicianId,
                        TechnicianName = technician != null ? $"{technician.FirstName} {technician.LastName}" : "Unknown",
                        AssignedDate = assignment.AssignedDate,
                        Status = assignment.Status
                    } : null
                };
            });
        }
    }
}
