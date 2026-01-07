using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Vehicle;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages customer vehicles
    /// </summary>
    [ApiController]
    [Route("api/vehicles")]
    [Authorize]
    public class VehiclesController : ControllerBase
    {
        private readonly IVehicleService _vehicleService;

        public VehiclesController(IVehicleService vehicleService)
        {
            _vehicleService = vehicleService;
        }

        /// <summary>
        /// Get all vehicles (ServiceManager)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<VehicleDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var vehicles = await _vehicleService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<VehicleDto>>
            {
                Success = true,
                Message = "Vehicles retrieved successfully",
                Data = vehicles
            });
        }

        /// <summary>
        /// Add new vehicle (Customer)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<VehicleDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateVehicleDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var vehicle = await _vehicleService.CreateAsync(userId, dto);
            
            return CreatedAtAction(nameof(GetAll), new ApiResponse<VehicleDto>
            {
                Success = true,
                Message = "Vehicle created successfully",
                Data = vehicle
            });
        }

        /// <summary>
        /// Update vehicle
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<VehicleDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateVehicleDto dto)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == UserRole.Customer)
            {
                var vehicle = await _vehicleService.GetByIdAsync(id);
                if (vehicle == null)
                {
                    return NotFound(new ApiResponse<object> { Success = false, Message = "Vehicle not found" });
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                if (vehicle.CustomerId != userId)
                {
                    return Forbid();
                }
            }

            var updatedVehicle = await _vehicleService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<VehicleDto>
            {
                Success = true,
                Message = "Vehicle updated successfully",
                Data = updatedVehicle
            });
        }

        /// <summary>
        /// Get customer's own vehicles (Customer)
        /// </summary>
        [HttpGet("my-vehicles")]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<VehicleDto>>), 200)]
        public async Task<IActionResult> GetMyVehicles()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var vehicles = await _vehicleService.GetByCustomerIdAsync(userId);
            return Ok(new ApiResponse<IEnumerable<VehicleDto>>
            {
                Success = true,
                Message = "Your vehicles retrieved successfully",
                Data = vehicles
            });
        }

        /// <summary>
        /// Delete vehicle (Customer - own vehicles only)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var vehicle = await _vehicleService.GetByIdAsync(id);
            if (vehicle == null)
            {
                return NotFound(new ApiResponse<object> { Success = false, Message = "Vehicle not found" });
            }

            if (vehicle.CustomerId != userId)
            {
                return Forbid();
            }
            if (vehicle.TotalServiceRequests > 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot delete vehicle with existing service requests. Please contact support."
                });
            }

            await _vehicleService.DeleteAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Vehicle deleted successfully",
                Data = true
            });
        }
    }
}
