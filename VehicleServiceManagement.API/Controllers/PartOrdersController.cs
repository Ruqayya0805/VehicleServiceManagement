using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.PartOrder;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages part orders for inventory restocking
    /// </summary>
    [ApiController]
    [Route("api/part-orders")]
    [Authorize(Roles = UserRole.ServiceManager)]
    [Produces("application/json")]
    public class PartOrdersController : ControllerBase
    {
        private readonly IPartOrderService _partOrderService;

        public PartOrdersController(IPartOrderService partOrderService)
        {
            _partOrderService = partOrderService;
        }

        /// <summary>
        /// Get all part orders
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PartOrderDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _partOrderService.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<PartOrderDto>>
            {
                Success = true,
                Message = "Part orders retrieved successfully",
                Data = orders
            });
        }

        /// <summary>
        /// Get part order by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<PartOrderDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _partOrderService.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Part order not found"
                });
            }

            return Ok(new ApiResponse<PartOrderDto>
            {
                Success = true,
                Message = "Part order retrieved successfully",
                Data = order
            });
        }

        /// <summary>
        /// Get pending orders (Pending, Ordered, Shipped)
        /// </summary>
        [HttpGet("pending")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PartOrderSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPending()
        {
            var orders = await _partOrderService.GetPendingOrdersAsync();
            return Ok(new ApiResponse<IEnumerable<PartOrderSummaryDto>>
            {
                Success = true,
                Message = "Pending orders retrieved successfully",
                Data = orders
            });
        }

        /// <summary>
        /// Get orders for a specific part
        /// </summary>
        [HttpGet("part/{partId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PartOrderSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetByPartId(int partId)
        {
            var orders = await _partOrderService.GetOrdersByPartIdAsync(partId);
            return Ok(new ApiResponse<IEnumerable<PartOrderSummaryDto>>
            {
                Success = true,
                Message = "Part orders retrieved successfully",
                Data = orders
            });
        }

        /// <summary>
        /// Create a new part order
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<PartOrderDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreatePartOrderDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Invalid order data",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var order = await _partOrderService.CreateAsync(dto, userId);

            return CreatedAtAction(nameof(GetById), new { id = order.PartOrderId }, new ApiResponse<PartOrderDto>
            {
                Success = true,
                Message = "Part order created successfully",
                Data = order
            });
        }

        /// <summary>
        /// Update a part order
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<PartOrderDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdatePartOrderDto dto)
        {
            var order = await _partOrderService.UpdateAsync(id, dto);
            return Ok(new ApiResponse<PartOrderDto>
            {
                Success = true,
                Message = "Part order updated successfully",
                Data = order
            });
        }

        /// <summary>
        /// Mark order as delivered (also updates stock)
        /// </summary>
        [HttpPost("{id}/deliver")]
        [ProducesResponseType(typeof(ApiResponse<PartOrderDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarkAsDelivered(int id)
        {
            var order = await _partOrderService.MarkAsDeliveredAsync(id);
            return Ok(new ApiResponse<PartOrderDto>
            {
                Success = true,
                Message = "Order marked as delivered and stock updated",
                Data = order
            });
        }

        /// <summary>
        /// Cancel a part order
        /// </summary>
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Cancel(int id)
        {
            await _partOrderService.CancelAsync(id);
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Part order cancelled successfully"
            });
        }
    }
}
