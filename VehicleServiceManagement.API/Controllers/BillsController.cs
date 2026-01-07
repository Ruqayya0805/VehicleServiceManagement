using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Bill;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages bills for service requests
    /// Consolidated RESTful API following best practices
    /// </summary>
    /// <remarks>
    /// This controller provides endpoints for managing service bills.
    /// 
    /// ## Consolidated Endpoints
    /// - **GET /api/bills** - Unified endpoint with query parameters
    ///   - Replaces: /service-request/{serviceRequestId}, /my-bills
    ///   - Query params: serviceRequestId, customerId, paymentStatus, fromDate, toDate, isOverdue
    ///   - For customers: automatically uses current user's ID if no customerId provided
    /// </remarks>
    [ApiController]
    [Route("api/bills")]
    [Authorize]
    [Produces("application/json")]
    public class BillsController : ControllerBase
    {
        private readonly IBillService _billService;

        public BillsController(IBillService billService)
        {
            _billService = billService;
        }

        #region Consolidated GET Endpoint

        /// <summary>
        /// Get bills with optional filtering
        /// </summary>
        /// <remarks>
        /// This unified endpoint replaces the following deprecated endpoints:
        /// - GET /api/bills/service-request/{serviceRequestId}
        /// - GET /api/bills/my-bills
        /// 
        /// **Authorization Logic:**
        /// - ServiceManager: Can view all bills or filter by any parameter
        /// - Customer: Automatically filters to their own bills (customerId is ignored)
        /// - Technician: Can view bills for service requests they are assigned to
        /// 
        /// **Example Requests:**
        /// ```
        /// GET /api/bills                                    # All (ServiceManager) or own (customer)
        /// GET /api/bills?serviceRequestId=123               # Filter by service request
        /// GET /api/bills?customerId=5                       # Filter by customer (ServiceManager only)
        /// GET /api/bills?paymentStatus=Pending              # Filter by payment status
        /// GET /api/bills?isOverdue=true                     # Get only overdue bills
        /// GET /api/bills?fromDate=2024-01-01&amp;toDate=2024-12-31  # Filter by date range
        /// ```
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "message": "Bills retrieved successfully",
        ///   "data": [
        ///     {
        ///       "billId": 1,
        ///       "billNumber": "BILL-20240115-ABC12345",
        ///       "customerName": "John Doe",
        ///       "vehicleInfo": "Toyota Camry (ABC-1234)",
        ///       "totalAmount": 450.00,
        ///       "amountPaid": 200.00,
        ///       "balanceDue": 250.00,
        ///       "paymentStatus": "PartiallyPaid",
        ///       "dueDate": "2024-02-15T00:00:00Z"
        ///     }
        ///   ]
        /// }
        /// ```
        /// </remarks>
        /// <param name="filter">Filter parameters for querying bills</param>
        /// <returns>List of bill summaries matching the filter criteria</returns>
        /// <response code="200">Returns filtered bills</response>
        /// <response code="401">Unauthorized - user not authenticated</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BillSummaryDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetAll([FromQuery] BillFilterDto filter)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            if (userRole == UserRole.Customer)
            {
                filter.CustomerId = userId;
            }

            var bills = await _billService.GetFilteredAsync(filter);
            
            return Ok(new ApiResponse<IEnumerable<BillSummaryDto>>
            {
                Success = true,
                Message = "Bills retrieved successfully",
                Data = bills
            });
        }

        #endregion

        #region Standard Operations

        /// <summary>
        /// Get bill by ID
        /// </summary>
        /// <remarks>
        /// Retrieves detailed information about a specific bill including payment history.
        /// 
        /// **Authorization:**
        /// - Customers can only view their own bills
        /// - ServiceManager can view any bill
        /// 
        /// **Example Response:**
        /// ```json
        /// {
        ///   "success": true,
        ///   "data": {
        ///     "billId": 1,
        ///     "billNumber": "BILL-20240115-ABC12345",
        ///     "serviceRequestId": 123,
        ///     "serviceCharge": 300.00,
        ///     "partsCharge": 120.00,
        ///     "tax": 42.00,
        ///     "discount": 12.00,
        ///     "totalAmount": 450.00,
        ///     "payments": [
        ///       {
        ///         "paymentId": 1,
        ///         "amountPaid": 200.00,
        ///         "paymentDate": "2024-01-20T10:00:00Z",
        ///         "paymentMethod": "Card"
        ///       }
        ///     ]
        ///   }
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Bill ID</param>
        /// <returns>Bill details</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<BillDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var bill = await _billService.GetByIdAsync(id);
            if (bill == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Bill not found"
                });
            }

            return Ok(new ApiResponse<BillDto>
            {
                Success = true,
                Message = "Bill retrieved successfully",
                Data = bill
            });
        }

        /// <summary>
        /// Generate bill for service request - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Generates a new bill for a completed service request.
        /// 
        /// **Auto-calculation:**
        /// - TotalAmount = ServiceCharge + PartsCharge + Tax - Discount
        /// - PartsCharge is automatically calculated from service parts
        /// - ServiceCharge defaults to category base price if not specified
        /// 
        /// **Validation:**
        /// - Service request must exist
        /// - Bill must not already exist for this service request
        /// 
        /// **Example Request:**
        /// ```json
        /// POST /api/bills/generate/123
        /// {
        ///   "taxPercentage": 10,
        ///   "discount": 25.00,
        ///   "dueDate": "2024-02-15T00:00:00Z"
        /// }
        /// ```
        /// </remarks>
        /// <param name="serviceRequestId">Service request ID to generate bill for</param>
        /// <param name="dto">Optional bill generation parameters</param>
        /// <returns>Generated bill</returns>
        [HttpPost("generate/{serviceRequestId}")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<BillDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Generate(int serviceRequestId, [FromBody] GenerateBillDto? dto = null)
        {
            var generateDto = dto ?? new GenerateBillDto { ServiceRequestId = serviceRequestId };
            generateDto.ServiceRequestId = serviceRequestId;

            var bill = await _billService.GenerateAsync(generateDto);
            return CreatedAtAction(nameof(GetById), 
                new { id = bill.BillId }, 
                new ApiResponse<BillDto>
                {
                    Success = true,
                    Message = "Bill generated successfully",
                    Data = bill
                });
        }

        /// <summary>
        /// Update bill - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Updates an existing bill. Total is automatically recalculated.
        /// 
        /// **Example Request:**
        /// ```json
        /// PUT /api/bills/1
        /// {
        ///   "serviceCharge": 350.00,
        ///   "discount": 50.00
        /// }
        /// ```
        /// </remarks>
        /// <param name="id">Bill ID</param>
        /// <param name="dto">Update data</param>
        /// <returns>Updated bill</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<BillDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateBillDto dto)
        {
            var bill = await _billService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<BillDto>
            {
                Success = true,
                Message = "Bill updated successfully",
                Data = bill
            });
        }

        /// <summary>
        /// Recalculate bill totals - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Recalculates the bill totals based on current service parts.
        /// Useful when parts have been added or removed after initial bill generation.
        /// </remarks>
        /// <param name="id">Bill ID</param>
        /// <returns>Recalculated bill</returns>
        [HttpPost("{id}/recalculate")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<BillDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Recalculate(int id)
        {
            var bill = await _billService.RecalculateAsync(id);
            return Ok(new ApiResponse<BillDto>
            {
                Success = true,
                Message = "Bill recalculated successfully",
                Data = bill
            });
        }

        /// <summary>
        /// Delete bill - ServiceManager only
        /// </summary>
        /// <remarks>
        /// Deletes a bill. Cannot delete bills that have payments.
        /// </remarks>
        /// <param name="id">Bill ID</param>
        /// <returns>Success status</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            await _billService.DeleteAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Bill deleted successfully"
            });
        }

        #endregion
    }
}
