using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServicePart;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages parts used in service requests
    /// </summary>
    [ApiController]
    [Route("api/serviceparts")]
    [Authorize]
    public class ServicePartsController : ControllerBase
    {
        private readonly IServicePartService _servicePartService;

        public ServicePartsController(IServicePartService servicePartService)
        {
            _servicePartService = servicePartService;
        }

        /// <summary>
        /// Add part to service request (auto-deducts from inventory)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = $"{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<ServicePartDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> AddPartToService([FromBody] CreateServicePartDto dto)
        {
            var servicePart = await _servicePartService.AddPartToServiceAsync(dto);
            return CreatedAtAction(nameof(GetByServiceRequestId), 
                new { serviceRequestId = dto.ServiceRequestId }, 
                new ApiResponse<ServicePartDto>
                {
                    Success = true,
                    Message = "Part added to service successfully",
                    Data = servicePart
                });
        }

        /// <summary>
        /// Remove part from service (returns to inventory)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = $"{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        public async Task<IActionResult> Remove(int id)
        {
            await _servicePartService.RemoveAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Part removed from service successfully",
                Data = true
            });
        }

        /// <summary>
        /// Get parts used in a service request
        /// </summary>
        [HttpGet("service-request/{serviceRequestId}")]
        [Authorize(Roles = $"{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServicePartDto>>), 200)]
        public async Task<IActionResult> GetByServiceRequestId(int serviceRequestId)
        {
            var serviceParts = await _servicePartService.GetByServiceRequestIdAsync(serviceRequestId);
            return Ok(new ApiResponse<IEnumerable<ServicePartDto>>
            {
                Success = true,
                Message = "Service parts retrieved successfully",
                Data = serviceParts
            });
        }

        /// <summary>
        /// Calculate total parts cost for a service request
        /// </summary>
        [HttpGet("service-request/{serviceRequestId}/total")]
        [Authorize(Roles = $"{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        public async Task<IActionResult> GetTotalPartsCharge(int serviceRequestId)
        {
            var total = await _servicePartService.GetTotalPartsChargeAsync(serviceRequestId);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Total parts charge calculated",
                Data = new { ServiceRequestId = serviceRequestId, TotalPartsCharge = total }
            });
        }
    }
}
