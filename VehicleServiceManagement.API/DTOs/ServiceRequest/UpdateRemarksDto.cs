using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServiceRequest
{
    /// <summary>
    /// DTO for consolidated remarks endpoint that handles both customer and technician remarks.
    /// </summary>
    public class UpdateRemarksDto
    {
        /// <summary>
        /// The type of remark - either "Customer" or "Technician"
        /// </summary>
        /// <example>Customer</example>
        [Required]
        [RegularExpression("^(Customer|Technician)$", ErrorMessage = "RemarkType must be either 'Customer' or 'Technician'")]
        public string RemarkType { get; set; } = string.Empty;

        /// <summary>
        /// The remarks text content
        /// </summary>
        /// <example>The vehicle is making unusual noises during acceleration</example>
        [Required]
        [MaxLength(500)]
        public string Remarks { get; set; } = string.Empty;
    }
}
