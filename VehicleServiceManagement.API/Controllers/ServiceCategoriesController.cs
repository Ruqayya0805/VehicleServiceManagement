using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServiceCategory;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages service categories
    /// </summary>
    [ApiController]
    [Route("api/servicecategories")]
    [Authorize]
    public class ServiceCategoriesController : ControllerBase
    {
        private readonly IServiceCategoryService _serviceCategoryService;

        public ServiceCategoriesController(IServiceCategoryService serviceCategoryService)
        {
            _serviceCategoryService = serviceCategoryService;
        }

        /// <summary>
        /// Get all service categories
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceCategoryDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var categories = await _serviceCategoryService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<ServiceCategoryDto>>
            {
                Success = true,
                Message = "Service categories retrieved successfully",
                Data = categories
            });
        }

        /// <summary>
        /// Create service category (Admin, ServiceManager)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateServiceCategoryDto dto)
        {
            var category = await _serviceCategoryService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetAll), 
                new ApiResponse<ServiceCategoryDto>
                {
                    Success = true,
                    Message = "Service category created successfully",
                    Data = category
                });
        }

        /// <summary>
        /// Get active service categories only
        /// </summary>
        [HttpGet("active")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceCategoryDto>>), 200)]
        public async Task<IActionResult> GetActive()
        {
            var categories = await _serviceCategoryService.GetActiveAsync();
            return Ok(new ApiResponse<IEnumerable<ServiceCategoryDto>>
            {
                Success = true,
                Message = "Active service categories retrieved successfully",
                Data = categories
            });
        }

        /// <summary>
        /// Update service category (Admin, ServiceManager)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceCategoryDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceCategoryDto dto)
        {
            var category = await _serviceCategoryService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<ServiceCategoryDto>
            {
                Success = true,
                Message = "Service category updated successfully",
                Data = category
            });
        }

        /// <summary>
        /// Delete service category (Admin, ServiceManager)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Delete(int id)
        {
            await _serviceCategoryService.DeleteAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Service category deleted successfully",
                Data = true
            });
        }
    }
}
