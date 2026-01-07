namespace VehicleServiceManagement.API.DTOs.ServiceAssignment
{
    /// <summary>
    /// Filter parameters for querying service assignments.
    /// </summary>
    public class ServiceAssignmentFilterDto
    {
        /// <summary>
        /// Filter by technician ID. If not provided and user is a technician, defaults to current user.
        /// </summary>
        /// <example>5</example>
        public int? TechnicianId { get; set; }

        /// <summary>
        /// Filter by assignment status (Assigned, InProgress, Completed)
        /// </summary>
        /// <example>InProgress</example>
        public string? Status { get; set; }

        /// <summary>
        /// Filter by service request ID
        /// </summary>
        /// <example>123</example>
        public int? ServiceRequestId { get; set; }

        /// <summary>
        /// Filter assignments from this date
        /// </summary>
        public DateTime? FromDate { get; set; }

        /// <summary>
        /// Filter assignments to this date
        /// </summary>
        public DateTime? ToDate { get; set; }
    }
}
