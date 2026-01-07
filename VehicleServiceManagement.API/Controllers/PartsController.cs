using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Part;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages parts inventory
    /// </summary>
    [ApiController]
    [Route("api/parts")]
    [Authorize]
    public class PartsController : ControllerBase
    {
        private readonly IPartService _partService;

        public PartsController(IPartService partService)
        {
            _partService = partService;
        }

        /// <summary>
        /// Get all parts
        /// </summary>
        [HttpGet]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PartDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var parts = await _partService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<PartDto>>
            {
                Success = true,
                Message = "Parts retrieved successfully",
                Data = parts
            });
        }

        /// <summary>
        /// Add new part (Admin, ServiceManager)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<PartDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreatePartDto dto)
        {
            var part = await _partService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetAll), 
                new ApiResponse<PartDto>
                {
                    Success = true,
                    Message = "Part created successfully",
                    Data = part
                });
        }

        /// <summary>
        /// Update part (Admin, ServiceManager)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<PartDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePartDto dto)
        {
            var part = await _partService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<PartDto>
            {
                Success = true,
                Message = "Part updated successfully",
                Data = part
            });
        }

        /// <summary>
        /// Get part by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<PartDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(int id)
        {
            var part = await _partService.GetByIdAsync(id);
            return Ok(new ApiResponse<PartDto>
            {
                Success = true,
                Message = "Part retrieved successfully",
                Data = part
            });
        }

        /// <summary>
        /// Delete part (Admin, ServiceManager)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Delete(int id)
        {
            await _partService.DeleteAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Part deleted successfully",
                Data = true
            });
        }

        /// <summary>
        /// Get parts below reorder level
        /// </summary>
        [HttpGet("low-stock")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<LowStockPartDto>>), 200)]
        public async Task<IActionResult> GetLowStock()
        {
            var parts = await _partService.GetLowStockAsync();
            return Ok(new ApiResponse<IEnumerable<LowStockPartDto>>
            {
                Success = true,
                Message = "Low stock parts retrieved successfully",
                Data = parts
            });
        }
    }
}
