using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServiceAssignment
{
    public class AssignServiceDto
    {
        [Required]
        public int ServiceRequestId { get; set; }

        [Required]
        public int TechnicianId { get; set; }

        public string? Notes { get; set; }
    }
}