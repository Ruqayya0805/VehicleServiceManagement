using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Payment;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    /// <summary>
    /// Manages payment operations for bills
    /// </summary>
    [ApiController]
    [Route("api/payments")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly IBillService _billService;

        public PaymentsController(IPaymentService paymentService, IBillService billService)
        {
            _paymentService = paymentService;
            _billService = billService;
        }

        /// <summary>
        /// Record a new payment (ServiceManager)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = UserRole.ServiceManager)]
        [ProducesResponseType(typeof(ApiResponse<PaymentDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> RecordPayment([FromBody] CreatePaymentDto dto)
        {
            var payment = await _paymentService.ProcessPaymentAsync(dto.BillId, new ProcessPaymentDto
            {
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                TransactionId = dto.TransactionId
            });
            
            return CreatedAtAction(nameof(GetByBillId), 
                new { billId = dto.BillId }, 
                new ApiResponse<PaymentDto>
                {
                    Success = true,
                    Message = "Payment recorded successfully",
                    Data = payment
                });
        }

        /// <summary>
        /// Customer makes a payment for their own bill
        /// </summary>
        [HttpPost("pay")]
        [Authorize(Roles = UserRole.Customer)]
        [ProducesResponseType(typeof(ApiResponse<PaymentDto>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        [ProducesResponseType(typeof(ApiResponse<object>), 403)]
        public async Task<IActionResult> MakePayment([FromBody] CreatePaymentDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var bill = await _billService.GetByIdAsync(dto.BillId);
            if (bill == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Bill not found"
                });
            }
            
            if (bill.CustomerId != userId)
            {
                return StatusCode(403, new ApiResponse<object>
                {
                    Success = false,
                    Message = "You can only pay for your own bills"
                });
            }

            var payment = await _paymentService.ProcessPaymentAsync(dto.BillId, new ProcessPaymentDto
            {
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                TransactionId = dto.TransactionId
            });
            
            return CreatedAtAction(nameof(GetByBillId), 
                new { billId = dto.BillId }, 
                new ApiResponse<PaymentDto>
                {
                    Success = true,
                    Message = "Payment processed successfully",
                    Data = payment
                });
        }

        /// <summary>
        /// Get payments for a specific bill
        /// </summary>
        [HttpGet("bill/{billId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentDto>>), 200)]
        public async Task<IActionResult> GetByBillId(int billId)
        {
            var payments = await _paymentService.GetByBillIdAsync(billId);
            return Ok(new ApiResponse<IEnumerable<PaymentDto>>
            {
                Success = true,
                Message = "Payments for bill retrieved successfully",
                Data = payments
            });
        }
    }
}
