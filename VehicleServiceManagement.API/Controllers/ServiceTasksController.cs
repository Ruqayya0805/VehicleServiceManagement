using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServiceTask;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Repositories;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages service tasks - individual work items parsed from issue descriptions
    /// </summary>
    [ApiController]
    [Route("api/servicetasks")]
    [Authorize]
    [Produces("application/json")]
    public class ServiceTasksController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public ServiceTasksController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Get all tasks for a service request
        /// </summary>
        [HttpGet("by-request/{serviceRequestId}")]
        public async Task<IActionResult> GetByServiceRequest(int serviceRequestId)
        {
            var tasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == serviceRequestId);
            var users = await _unitOfWork.Users.GetAllAsync();

            var taskDtos = tasks.OrderBy(t => t.OrderIndex).Select(t => new ServiceTaskDto
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

            return Ok(new ApiResponse<List<ServiceTaskDto>>
            {
                Success = true,
                Message = "Tasks retrieved successfully",
                Data = taskDtos
            });
        }

        /// <summary>
        /// Toggle task completion status (Technician only)
        /// </summary>
        [HttpPut("{id}/toggle")]
        [Authorize(Roles = UserRole.Technician)]
        public async Task<IActionResult> ToggleTaskCompletion(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var task = await _unitOfWork.ServiceTasks.GetByIdAsync(id);
            if (task == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Task not found"
                });
            }
            var assignments = await _unitOfWork.ServiceAssignments.FindAsync(
                a => a.ServiceRequestId == task.ServiceRequestId && a.TechnicianId == userId);
            
            if (!assignments.Any())
            {
                return Forbid();
            }
            task.IsCompleted = !task.IsCompleted;
            task.CompletedDate = task.IsCompleted ? DateTime.UtcNow : null;
            task.CompletedByUserId = task.IsCompleted ? userId : null;

            await _unitOfWork.ServiceTasks.UpdateAsync(task);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<ServiceTaskDto>
            {
                Success = true,
                Message = task.IsCompleted ? "Task marked as completed" : "Task marked as incomplete",
                Data = new ServiceTaskDto
                {
                    ServiceTaskId = task.ServiceTaskId,
                    ServiceRequestId = task.ServiceRequestId,
                    Description = task.Description,
                    IsCompleted = task.IsCompleted,
                    CompletedDate = task.CompletedDate,
                    CompletedByUserId = task.CompletedByUserId,
                    Price = task.Price,
                    OrderIndex = task.OrderIndex
                }
            });
        }

        /// <summary>
        /// Update task price (Admin/ServiceManager only)
        /// </summary>
        [HttpPut("{id}/price")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        public async Task<IActionResult> UpdateTaskPrice(int id, [FromBody] UpdateServiceTaskDto dto)
        {
            var task = await _unitOfWork.ServiceTasks.GetByIdAsync(id);
            if (task == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Task not found"
                });
            }

            if (dto.Price.HasValue)
            {
                task.Price = dto.Price.Value;
            }

            await _unitOfWork.ServiceTasks.UpdateAsync(task);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<ServiceTaskDto>
            {
                Success = true,
                Message = "Task price updated successfully",
                Data = new ServiceTaskDto
                {
                    ServiceTaskId = task.ServiceTaskId,
                    ServiceRequestId = task.ServiceRequestId,
                    Description = task.Description,
                    IsCompleted = task.IsCompleted,
                    CompletedDate = task.CompletedDate,
                    CompletedByUserId = task.CompletedByUserId,
                    Price = task.Price,
                    OrderIndex = task.OrderIndex
                }
            });
        }

        /// <summary>
        /// Add additional charge to a service request (Admin/ServiceManager only)
        /// </summary>
        [HttpPost("additional-charge")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        public async Task<IActionResult> AddAdditionalCharge([FromBody] CreateAdditionalChargeDto dto)
        {
            var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(dto.ServiceRequestId);
            if (serviceRequest == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Service request not found"
                });
            }
            var existingTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == dto.ServiceRequestId);
            var maxOrder = existingTasks.Any() ? existingTasks.Max(t => t.OrderIndex) : 0;

            var task = new Models.ServiceTask
            {
                ServiceRequestId = dto.ServiceRequestId,
                Description = $"[Additional] {dto.Title}",
                Price = dto.Amount,
                IsCompleted = true,
                CompletedDate = DateTime.UtcNow,
                OrderIndex = maxOrder + 1,
                CreatedDate = DateTime.UtcNow
            };

            await _unitOfWork.ServiceTasks.AddAsync(task);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<ServiceTaskDto>
            {
                Success = true,
                Message = "Additional charge added successfully",
                Data = new ServiceTaskDto
                {
                    ServiceTaskId = task.ServiceTaskId,
                    ServiceRequestId = task.ServiceRequestId,
                    Description = task.Description,
                    IsCompleted = task.IsCompleted,
                    CompletedDate = task.CompletedDate,
                    Price = task.Price,
                    OrderIndex = task.OrderIndex
                }
            });
        }

        /// <summary>
        /// Delete a service task (Admin/ServiceManager only) - Only for additional charges
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _unitOfWork.ServiceTasks.GetByIdAsync(id);
            if (task == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Task not found"
                });
            }
            if (!task.Description.StartsWith("[Additional]") && !task.Description.StartsWith("[Extra]"))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Only additional charges can be deleted"
                });
            }

            await _unitOfWork.ServiceTasks.DeleteAsync(task);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Additional charge deleted successfully",
                Data = true
            });
        }

        /// <summary>
        /// Bulk update task prices (Admin/ServiceManager only) - used when creating bills
        /// </summary>
        [HttpPut("bulk-prices")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        public async Task<IActionResult> BulkUpdatePrices([FromBody] BulkUpdateTaskPricesDto dto)
        {
            var taskIds = dto.TaskPrices.Select(t => t.ServiceTaskId).ToList();
            var tasks = await _unitOfWork.ServiceTasks.FindAsync(t => taskIds.Contains(t.ServiceTaskId));

            foreach (var taskPrice in dto.TaskPrices)
            {
                var task = tasks.FirstOrDefault(t => t.ServiceTaskId == taskPrice.ServiceTaskId);
                if (task != null)
                {
                    task.Price = taskPrice.Price;
                    await _unitOfWork.ServiceTasks.UpdateAsync(task);
                }
            }

            await _unitOfWork.SaveChangesAsync();
            if (tasks.Any())
            {
                var serviceRequestId = tasks.First().ServiceRequestId;
                var allTasks = await _unitOfWork.ServiceTasks.FindAsync(t => t.ServiceRequestId == serviceRequestId);
                var totalCost = allTasks.Sum(t => t.Price ?? 0);

                var serviceRequest = await _unitOfWork.ServiceRequests.GetByIdAsync(serviceRequestId);
                if (serviceRequest != null)
                {
                    serviceRequest.ActualCost = totalCost;
                    await _unitOfWork.ServiceRequests.UpdateAsync(serviceRequest);
                    await _unitOfWork.SaveChangesAsync();
                }
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Task prices updated successfully",
                Data = true
            });
        }
    }
}
