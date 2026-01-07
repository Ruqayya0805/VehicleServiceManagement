using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.ServiceRequest;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages service requests - CORE FEATURE
    /// Consolidated RESTful API following best practices
    /// </summary>
    /// <remarks>
    /// This controller provides endpoints for managing vehicle service requests.
    /// 
    /// ## Consolidated Endpoints
    /// - **GET /api/servicerequests** - Unified endpoint with query parameters for filtering
    ///   - Replaces: /filter, /my-requests, /assigned-to-me
    ///   - Query params: status, customerId, technicianId, priority, fromDate, toDate, pageNumber, pageSize
    /// 
    /// - **PUT /api/servicerequests/{id}/remarks** - Unified remarks endpoint
    ///   - Replaces: /customer-remarks, /technician-remarks
    ///   - Body: { "remarkType": "Customer" | "Technician", "remarks": "text" }
    /// </remarks>
    [ApiController]
    [Route("api/servicerequests")]
    [Authorize]
    [Produces("application/json")]
    public class ServiceRequestsController : ControllerBase
    {
        private readonly IServiceRequestService _serviceRequestService;

        public ServiceRequestsController(IServiceRequestService serviceRequestService)
        {
            _serviceRequestService = serviceRequestService;
        }

        #region Consolidated GET Endpoint

        /// <summary>
        /// Get service requests with optional filtering
        /// </summary>
        /// <remarks>
        /// This unified endpoint replaces the following deprecated endpoints:
        /// - GET /api/servicerequests/filter
        /// - GET /api/servicerequests/my-requests  
        /// - GET /api/servicerequests/assigned-to-me
        /// 
        /// **Authorization Logic:**
        /// - Admin/ServiceManager: Can view all requests or filter by any parameter
        /// - Customer: Automatically filters to their own requests (customerId is ignored)
        /// - Technician: Automatically filters to their assigned requests (technicianId is ignored)
        /// 
        /// **Example Requests:**
        /// ```
        /// GET /api/servicerequests?status=InProgress&amp;priority=High
        /// GET /api/servicerequests?fromDate=2024-01-01&amp;toDate=2024-12-31
        /// GET /api/servicerequests?customerId=5&amp;pageNumber=1&amp;pageSize=20
        /// ```
        /// </remarks>
        /// <param name="filter">Filter parameters for querying service requests</param>
        /// <returns>Paged list of service requests matching the filter criteria</returns>
        /// <response code="200">Returns filtered service requests</response>
        /// <response code="401">Unauthorized - user not authenticated</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ServiceRequestDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] ServiceRequestFilterDto filter)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (userRole == UserRole.Customer)
            {
                filter.CustomerId = userId;
            }
            else if (userRole == UserRole.Technician)
            {
                filter.TechnicianId = userId;
            }
            var result = await _serviceRequestService.GetFilteredAsync(filter);
            
            return Ok(new ApiResponse<PagedResult<ServiceRequestDto>>
            {
                Success = true,
                Message = "Service requests retrieved successfully",
                Data = result
            });
        }

        #endregion

        #region Standard CRUD Operations

        /// <summary>
        /// Get service request by ID
        /// </summary>
        /// <remarks>
        /// Retrieves detailed information about a specific service request.
        /// 
        /// **Authorization:**
        /// - Customers can only view their own requests
        /// - Technicians can only view their assigned requests
        /// - Admin/ServiceManager can view any request
        /// 
        /// **Example Request:**
        /// ```
        /// GET /api/servicerequests/123
        /// ```
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "message": "Service request retrieved successfully",
        ///   "data": {
        ///     "serviceRequestId": 123,
        ///     "vehicleInfo": "Toyota Camry (2020)",
        ///     "customerName": "John Doe",
        ///     "status": "InProgress",
        ///     "priority": "High",
        ///     "issueDescription": "Engine making unusual noise",
        ///     "assignment": {
        ///       "technicianName": "Mike Smith",
        ///       "status": "InProgress"
        ///     }
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">The service request ID</param>
        /// <returns>Service request details</returns>
        /// <response code="200">Returns the service request</response>
        /// <response code="403">Forbidden - user cannot access this request</response>
        /// <response code="404">Service request not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var request = await _serviceRequestService.GetByIdAsync(id);
            if (request == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Service request not found"
                });
            }
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            if (userRole == UserRole.Customer && request.CustomerId != userId)
            {
                return Forbid();
            }
            if (userRole == UserRole.Technician && request.Assignment?.TechnicianId != userId)
            {
                return Forbid();
            }

            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = "Service request retrieved successfully",
                Data = request
            });
        }

        /// <summary>
        /// Create new service request (Customer only)
        /// </summary>
        /// <remarks>
        /// Creates a new service request for a customer's vehicle.
        /// 
        /// **Authorization:** Customer role only
        /// 
        /// **Validation:**
        /// - Vehicle must belong to the customer
        /// - Category must be active
        /// 
        /// **Example Request:**
        /// ```json
        /// POST /api/servicerequests
        /// {
        ///   "vehicleId": 10,
        ///   "categoryId": 3,
        ///   "issueDescription": "Brake pads need replacement",
        ///   "priority": "Normal",
        ///   "scheduledDate": "2024-02-15T10:00:00Z",
        ///   "customerRemarks": "Squeaking noise when braking"
        /// }
        /// ```
        /// </remarks>
        /// <param name="dto">Service request creation data</param>
        /// <returns>Created service request</returns>
        /// <response code="201">Service request created successfully</response>
        /// <response code="400">Invalid request data</response>
        [HttpPost]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateServiceRequestDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var request = await _serviceRequestService.CreateAsync(userId, dto);
            
            return CreatedAtAction(nameof(GetById), new { id = request.ServiceRequestId }, 
                new ApiResponse<ServiceRequestDto>
                {
                    Success = true,
                    Message = "Service request created successfully",
                    Data = request
                });
        }

        /// <summary>
        /// Update service request (Admin, ServiceManager, Technician)
        /// </summary>
        /// <remarks>
        /// Updates an existing service request.
        /// 
        /// **Authorization:** Admin, ServiceManager, or Technician roles
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/servicerequests/123
        /// {
        ///   "scheduledDate": "2024-02-20T14:00:00Z",
        ///   "priority": "High",
        ///   "actualCost": 350.00
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Service request ID</param>
        /// <param name="dto">Update data</param>
        /// <returns>Updated service request</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager},{UserRole.Technician}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceRequestDto dto)
        {
            var request = await _serviceRequestService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = "Service request updated successfully",
                Data = request
            });
        }

        #endregion

        #region Status Management

        /// <summary>
        /// Update service request status (Admin, ServiceManager)
        /// </summary>
        /// <remarks>
        /// Updates the status of a service request.
        /// 
        /// **Valid Status Transitions:**
        /// - Requested ? Assigned ? InProgress ? Completed ? Closed
        /// - Any status ? Cancelled (except Completed/Closed)
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/servicerequests/123/status
        /// {
        ///   "status": "Completed"
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Service request ID</param>
        /// <param name="dto">New status</param>
        /// <returns>Updated service request</returns>
        [HttpPut("{id}/status")]
        [Authorize(Roles = $"{UserRole.Admin},{UserRole.ServiceManager}")]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var request = await _serviceRequestService.UpdateStatusAsync(id, dto.Status);
            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = $"Status updated to '{dto.Status}'",
                Data = request
            });
        }

        #endregion

        #region Consolidated Remarks Endpoint

        /// <summary>
        /// Add remarks to service request (Consolidated endpoint)
        /// </summary>
        /// <remarks>
        /// **This endpoint consolidates the following deprecated endpoints:**
        /// - PUT /api/servicerequests/{id}/customer-remarks
        /// - PUT /api/servicerequests/{id}/technician-remarks
        /// 
        /// **Authorization:**
        /// - Customers can only add "Customer" remarks
        /// - Technicians can only add "Technician" remarks
        /// - Admin/ServiceManager can add both types
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/servicerequests/123/remarks
        /// {
        ///   "remarkType": "Customer",
        ///   "remarks": "Vehicle is making noise especially in cold weather"
        /// }
        /// ```
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "message": "Remarks added successfully",
        ///   "data": {
        ///     "serviceRequestId": 123,
        ///     "customerRemarks": "Vehicle is making noise especially in cold weather",
        ///     ...
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Service request ID</param>
        /// <param name="dto">Remarks data with type and content</param>
        /// <returns>Updated service request</returns>
        /// <response code="200">Remarks added successfully</response>
        /// <response code="400">Invalid remark type or missing data</response>
        /// <response code="403">User not authorized to add this type of remark</response>
        /// <response code="404">Service request not found</response>
        [HttpPut("{id}/remarks")]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRemarks(int id, [FromBody] UpdateRemarksDto dto)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (dto.RemarkType.Equals("Customer", StringComparison.OrdinalIgnoreCase))
            {
                if (userRole != UserRole.Customer && userRole != UserRole.Admin && userRole != UserRole.ServiceManager)
                {
                    return Forbid();
                }
            }
            else if (dto.RemarkType.Equals("Technician", StringComparison.OrdinalIgnoreCase))
            {
                if (userRole != UserRole.Technician && userRole != UserRole.Admin && userRole != UserRole.ServiceManager)
                {
                    return Forbid();
                }
            }
            else
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "RemarkType must be either 'Customer' or 'Technician'"
                });
            }

            var request = await _serviceRequestService.UpdateRemarksAsync(id, dto.RemarkType, dto.Remarks);
            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = $"{dto.RemarkType} remarks added successfully",
                Data = request
            });
        }

        #endregion

        #region Customer Actions (Cancel & Reschedule)

        /// <summary>
        /// Cancel a service request (Customer only)
        /// </summary>
        /// <remarks>
        /// Allows customers to cancel their own service requests.
        /// 
        /// **Authorization:** Customer can only cancel their own requests
        /// 
        /// **Validation:**
        /// - Cannot cancel completed or closed requests
        /// - Request must belong to the customer
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/servicerequests/123/cancel
        /// {
        ///   "reason": "I found a cheaper option"
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Service request ID</param>
        /// <param name="dto">Cancellation reason</param>
        /// <returns>Updated service request</returns>
        /// <response code="200">Service request cancelled successfully</response>
        /// <response code="400">Cannot cancel this request (already completed/closed)</response>
        /// <response code="403">Forbidden - user cannot cancel this request</response>
        /// <response code="404">Service request not found</response>
        [HttpPut("{id}/cancel")]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CancelService(int id, [FromBody] CancelServiceDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var existingRequest = await _serviceRequestService.GetByIdAsync(id);
            if (existingRequest == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Service request not found"
                });
            }

            if (existingRequest.CustomerId != userId)
            {
                return Forbid();
            }

            var request = await _serviceRequestService.CancelServiceAsync(id, dto);
            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = "Service request cancelled successfully",
                Data = request
            });
        }

        /// <summary>
        /// Reschedule a service request (Customer only)
        /// </summary>
        /// <remarks>
        /// Allows customers to reschedule their own service requests.
        /// 
        /// **Authorization:** Customer can only reschedule their own requests
        /// 
        /// **Validation:**
        /// - Cannot reschedule completed or closed requests
        /// - New date must be in the future
        /// - Request must belong to the customer
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/servicerequests/123/reschedule
        /// {
        ///   "newDate": "2026-01-15T10:00:00Z"
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Service request ID</param>
        /// <param name="dto">New scheduled date</param>
        /// <returns>Updated service request</returns>
        /// <response code="200">Service request rescheduled successfully</response>
        /// <response code="400">Cannot reschedule this request (completed/closed or date in past)</response>
        /// <response code="403">Forbidden - user cannot reschedule this request</response>
        /// <response code="404">Service request not found</response>
        [HttpPut("{id}/reschedule")]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<ServiceRequestDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> RescheduleService(int id, [FromBody] RescheduleServiceDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var existingRequest = await _serviceRequestService.GetByIdAsync(id);
            if (existingRequest == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Service request not found"
                });
            }

            if (existingRequest.CustomerId != userId)
            {
                return Forbid();
            }

            var request = await _serviceRequestService.RescheduleAsync(id, dto.NewDate);
            return Ok(new ApiResponse<ServiceRequestDto>
            {
                Success = true,
                Message = "Service request rescheduled successfully",
                Data = request
            });
        }

        #endregion
    }

    #region Request DTOs

    /// <summary>
    /// DTO for status update request
    /// </summary>
    public class UpdateStatusDto
    {
        /// <summary>
        /// The new status value
        /// </summary>
        /// <example>Completed</example>
        public string Status { get; set; } = string.Empty;
    }

    #endregion
}
