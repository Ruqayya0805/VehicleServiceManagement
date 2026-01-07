namespace VehicleServiceManagement.API.DTOs.Bill
{
    /// <summary>
    /// Filter parameters for querying bills.
    /// </summary>
    public class BillFilterDto
    {
        /// <summary>
        /// Filter by service request ID
        /// </summary>
        /// <example>123</example>
        public int? ServiceRequestId { get; set; }

        /// <summary>
        /// Filter by customer ID. If not provided and user is a customer, defaults to current user.
        /// </summary>
        /// <example>45</example>
        public int? CustomerId { get; set; }

        /// <summary>
        /// Filter by payment status (Pending, Partial, Paid, Overdue)
        /// </summary>
        /// <example>Pending</example>
        public string? PaymentStatus { get; set; }

        /// <summary>
        /// Filter bills generated from this date
        /// </summary>
        public DateTime? FromDate { get; set; }

        /// <summary>
        /// Filter bills generated to this date
        /// </summary>
        public DateTime? ToDate { get; set; }

        /// <summary>
        /// Filter to show only overdue bills
        /// </summary>
        /// <example>false</example>
        public bool? IsOverdue { get; set; }
    }
}
