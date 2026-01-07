using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServiceAssignment
{
    /// <summary>
    /// DTO for consolidated status update endpoint that handles starting, completing, and reopening assignments.
    /// </summary>
    public class UpdateAssignmentStatusDto
    {
        /// <summary>
        /// The target status - "InProgress", "Completed", or "Reopen"
        /// </summary>
        /// <example>InProgress</example>
        [Required]
        [RegularExpression("^(InProgress|Completed|Reopen)$", ErrorMessage = "Status must be 'InProgress', 'Completed', or 'Reopen'")]
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Optional notes for the status transition
        /// </summary>
        /// <example>Starting work on brake replacement</example>
        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
