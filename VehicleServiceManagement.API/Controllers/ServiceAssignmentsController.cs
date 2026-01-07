using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServiceAssignment;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages technician service assignments
    /// Consolidated RESTful API following best practices
    /// </summary>
    /// <remarks>
    /// This controller provides endpoints for managing service assignments to technicians.
    /// 
    /// ## Consolidated Endpoints
    /// - **GET /api/serviceassignments** - Unified endpoint with query parameters
    ///   - Replaces: /my-assignments, /technician/{technicianId}
    ///   - Query params: technicianId, status, serviceRequestId, fromDate, toDate
    ///   - For technicians: automatically uses current user's ID if no technicianId provided
    /// 
    /// - **PUT /api/serviceassignments/{id}/status** - Unified status transition endpoint
    ///   - Replaces: /start, /complete
    ///   - Body: { "status": "InProgress" | "Completed", "notes": "optional" }
    /// </remarks>
    [ApiController]
    [Route("api/serviceassignments")]
    [Authorize]
    [Produces("application/json")]
    public class ServiceAssignmentsController : ControllerBase
    {
        private readonly IServiceAssignmentService _serviceAssignmentService;

        public ServiceAssignmentsController(IServiceAssignmentService serviceAssignmentService)
        {
            _serviceAssignmentService = serviceAssignmentService;
        }

        #region Consolidated GET Endpoint

        /// <summary>
        /// Get service assignments with optional filtering
        /// </summary>
        /// <remarks>
        /// This unified endpoint replaces the following deprecated endpoints:
        /// - GET /api/serviceassignments/my-assignments
        /// - GET /api/serviceassignments/technician/{technicianId}
        /// 
        /// **Authorization Logic:**
        /// - ServiceManager: Can view all assignments or filter by any parameter
        /// - Technician: If no technicianId provided, automatically uses current user's ID
        ///   (can only see their own assignments)
        /// 
        /// **Example Requests:**
        /// ```
        /// GET /api/serviceassignments                          # All (ServiceManager) or own (technician)
        /// GET /api/serviceassignments?technicianId=5           # Filter by technician (ServiceManager only)
        /// GET /api/serviceassignments?status=InProgress        # Filter by status
        /// GET /api/serviceassignments?serviceRequestId=123     # Filter by service request
        /// ```
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "message": "Service assignments retrieved successfully",
        ///   "data": [
        ///     {
        ///       "assignmentId": 1,
        ///       "serviceRequestId": 123,
        ///       "technicianName": "John Smith",
        ///       "status": "InProgress",
        ///       "assignedDate": "2024-01-15T10:00:00Z",
        ///       "priority": "High"
        ///     }
        ///   ]
        /// }
        /// ```
        /// </remarks>
        /// <param name="filter">Filter parameters for querying assignments</param>
        /// <returns>List of service assignments matching the filter criteria</returns>
        /// <response code="200">Returns filtered service assignments</response>
        /// <response code="401">Unauthorized - user not authenticated</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ServiceAssignmentDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] ServiceAssignmentFilterDto filter)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (userRole == UserRole.Technician)
            {
                if (!filter.TechnicianId.HasValue)
                {
                    filter.TechnicianId = userId;
                }
                else if (filter.TechnicianId.Value != userId)
                {
                    return Forbid();
                }
            }

            var assignments = await _serviceAssignmentService.GetFilteredAsync(filter);
            
            return Ok(new ApiResponse<IEnumerable<ServiceAssignmentDto>>
            {
                Success = true,
                Message = "Service assignments retrieved successfully",
                Data = assignments
            });
        }

        #endregion

        #region Standard CRUD Operations

        /// <summary>
        /// Get assignment by ID
        /// </summary>
        /// <param name="id">Assignment ID</param>
        /// <returns>Assignment details</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceAssignmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var assignment = await _serviceAssignmentService.GetByIdAsync(id);
            if (assignment == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Assignment not found"
                });
            }
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (userRole == UserRole.Technician && assignment.TechnicianId != userId)
            {
                return Forbid();
            }

            return Ok(new ApiResponse<ServiceAssignmentDto>
            {
                Success = true,
                Message = "Assignment retrieved successfully",
                Data = assignment
            });
        }

        /// <summary>
        /// Create assignment (assign technician) - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Creates a new assignment, linking a service request to a technician.
        /// 
        /// **Validation:**
        /// - Service request must exist and be in "Requested" status
        /// - Technician must exist and have the Technician role
        /// - Service request must not already have an assignment
        /// 
        /// **Example Request:**
        /// ```json
        /// POST /api/serviceassignments
        /// {
        ///   "serviceRequestId": 123,
        ///   "technicianId": 5,
        ///   "notes": "Priority customer - handle with care"
        /// }
        /// ```
        /// </remarks>
        /// <param name="dto">Assignment creation data</param>
        /// <returns>Created assignment</returns>
        [HttpPost]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<ServiceAssignmentDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Create([FromBody] CreateServiceAssignmentDto dto)
        {
            var assignment = await _serviceAssignmentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = assignment.AssignmentId },
                new ApiResponse<ServiceAssignmentDto>
                {
                    Success = true,
                    Message = "Assignment created successfully",
                    Data = assignment
                });
        }

        /// <summary>
        /// Update assignment - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Updates an existing assignment. Can be used to reassign technicians or update notes.
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/serviceassignments/1
        /// {
        ///   "technicianId": 7,
        ///   "notes": "Reassigned due to technician availability"
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Assignment ID</param>
        /// <param name="dto">Update data</param>
        /// <returns>Updated assignment</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<ServiceAssignmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceAssignmentDto dto)
        {
            var assignment = await _serviceAssignmentService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<ServiceAssignmentDto>
            {
                Success = true,
                Message = "Assignment updated successfully",
                Data = assignment
            });
        }

        /// <summary>
        /// Delete assignment - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Deletes an assignment. Cannot delete completed assignments.
        /// </remarks>
        /// <param name="id">Assignment ID</param>
        /// <returns>Success status</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            var assignment = await _serviceAssignmentService.GetByIdAsync(id);
            if (assignment == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Assignment not found"
                });
            }

            if (assignment.Status == ServiceStatus.Completed.ToString())
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Cannot delete a completed assignment"
                });
            }

            await _serviceAssignmentService.DeleteAsync(id);
            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Assignment deleted successfully",
                Data = true
            });
        }

        #endregion

        #region Consolidated Status Endpoint

        /// <summary>
        /// Update assignment status (Consolidated endpoint)
        /// </summary>
        /// <remarks>
        /// **This endpoint consolidates the following deprecated endpoints:**
        /// - PUT /api/serviceassignments/{id}/start
        /// - PUT /api/serviceassignments/{id}/complete
        /// 
        /// **Authorization:** Technician role only (must be assigned technician)
        /// 
        /// **Valid Status Transitions:**
        /// - Assigned → InProgress (start work)
        /// - InProgress → Completed (finish work)
        /// - Completed → InProgress (reopen - only if service request is not closed)
        /// 
        /// **Business Logic:**
        /// - When setting status to "InProgress": Sets StartedDate, updates service request status
        /// - When setting status to "Completed": Sets CompletedDate, updates service request status
        /// - When setting status to "Reopen": Clears CompletedDate, sets status back to InProgress
        ///   (fails if service request is already closed by service manager)
        /// 
        /// **Example Request - Start Work:**
        /// ```json
        /// PUT /api/serviceassignments/1/status
        /// {
        ///   "status": "InProgress",
        ///   "notes": "Starting brake pad replacement"
        /// }
        /// ```
        /// 
        /// **Example Request - Complete Work:**
        /// ```json
        /// PUT /api/serviceassignments/1/status
        /// {
        ///   "status": "Completed",
        ///   "notes": "Replaced front and rear brake pads. Test drive completed."
        /// }
        /// ```
        /// 
        /// **Example Request - Reopen Work:**
        /// ```json
        /// PUT /api/serviceassignments/1/status
        /// {
        ///   "status": "Reopen",
        ///   "notes": "Reopening to add additional repairs"
        /// }
        /// ```
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "message": "Assignment status updated to 'Completed'",
        ///   "data": {
        ///     "assignmentId": 1,
        ///     "status": "Completed",
        ///     "startedDate": "2024-01-15T10:00:00Z",
        ///     "completedDate": "2024-01-15T14:30:00Z",
        ///     "notes": "Replaced front and rear brake pads. Test drive completed."
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Assignment ID</param>
        /// <param name="dto">Status update data</param>
        /// <returns>Updated assignment</returns>
        /// <response code="200">Status updated successfully</response>
        /// <response code="400">Invalid status transition</response>
        /// <response code="403">User is not the assigned technician</response>
        /// <response code="404">Assignment not found</response>
        [HttpPut("{id}/status")]
        [Authorize(Roles = UserRole.Technician)]
        [ProducesResponseType(typeof(ApiResponse<ServiceAssignmentDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAssignmentStatusDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var assignments = await _serviceAssignmentService.GetByTechnicianIdAsync(userId);
            if (!assignments.Any(a => a.AssignmentId == id))
            {
                return Forbid();
            }

            var result = await _serviceAssignmentService.UpdateStatusAsync(id, dto.Status, dto.Notes);
            return Ok(new ApiResponse<ServiceAssignmentDto>
            {
                Success = true,
                Message = $"Assignment status updated to '{dto.Status}'",
                Data = result
            });
        }

        #endregion
    }
}
