using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.User;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages user accounts
    /// </summary>
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Get all users (Admin only)
        /// </summary>
        [HttpGet]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<UserDto>>
            {
                Success = true,
                Message = "Users retrieved successfully",
                Data = users
            });
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }

            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Message = "User retrieved successfully",
                Data = user
            });
        }

        /// <summary>
        /// Create a new staff user (Admin only) - for ServiceManager or Technician roles only
        /// </summary>
        [HttpPost]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            var allowedRoles = new[] { UserRole.ServiceManager, UserRole.Technician };
            if (!allowedRoles.Contains(dto.Role))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Can only create ServiceManager or Technician accounts. Customers must register themselves and there can only be one Admin."
                });
            }

            var user = await _userService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = user.UserId }, new ApiResponse<UserDto>
            {
                Success = true,
                Message = "User created successfully",
                Data = user
            });
        }

        /// <summary>
        /// Update user (Admin only)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _userService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Message = "User updated successfully",
                Data = user
            });
        }

        /// <summary>
        /// Delete user (Admin only) - only for ServiceManager and Technician
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Delete(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "User not found"
                });
            }
            var deletableRoles = new[] { UserRole.ServiceManager, UserRole.Technician };
            if (!deletableRoles.Contains(user.Role))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Can only delete ServiceManager or Technician accounts."
                });
            }

            await _userService.DeleteAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "User deleted successfully",
                Data = true
            });
        }

        /// <summary>
        /// Get all technicians (ServiceManager)
        /// </summary>
        [HttpGet("technicians")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<TechnicianDto>>), 200)]
        public async Task<IActionResult> GetTechnicians()
        {
            var technicians = await _userService.GetTechniciansAsync();
            return Ok(new ApiResponse<IEnumerable<TechnicianDto>>
            {
                Success = true,
                Message = "Technicians retrieved successfully",
                Data = technicians
            });
        }

        /// <summary>
        /// Get all pending staff registrations (Admin only)
        /// </summary>
        [HttpGet("pending-approvals")]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<UserDto>>), 200)]
        public async Task<IActionResult> GetPendingApprovals()
        {
            var users = await _userService.GetPendingApprovalsAsync();
            return Ok(new ApiResponse<IEnumerable<UserDto>>
            {
                Success = true,
                Message = "Pending staff approvals retrieved successfully",
                Data = users
            });
        }

        /// <summary>
        /// Approve a pending staff registration (Admin only)
        /// </summary>
        [HttpPost("{id}/approve")]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<UserDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> ApproveStaff(int id)
        {
            var user = await _userService.ApproveStaffAsync(id);
            return Ok(new ApiResponse<UserDto>
            {
                Success = true,
                Message = "Staff registration approved successfully",
                Data = user
            });
        }

        /// <summary>
        /// Reject a pending staff registration (Admin only)
        /// </summary>
        [HttpPost("{id}/reject")]
        [Authorize(Roles = UserRole.Admin)]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> RejectStaff(int id)
        {
            await _userService.RejectStaffAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Staff registration rejected and removed",
                Data = true
            });
        }
    }
}
