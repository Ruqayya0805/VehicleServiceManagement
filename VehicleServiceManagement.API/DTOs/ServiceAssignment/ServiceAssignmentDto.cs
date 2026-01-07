using System.ComponentModel.DataAnnotations;
using VehicleServiceManagement.API.DTOs.ServiceTask;

namespace VehicleServiceManagement.API.DTOs.ServiceAssignment
{
    public class ServiceAssignmentDto
    {
        public int AssignmentId { get; set; }
        public int ServiceRequestId { get; set; }
        public string ServiceDescription { get; set; } = string.Empty;
        public string? IssueDescription { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; }
        public DateTime? StartedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Priority { get; set; } = string.Empty;
        public bool HasBill { get; set; }
        public int? BillId { get; set; }
        public bool IsClosed { get; set; }
        public List<ServiceTaskDto> Tasks { get; set; } = new();
    }

    public class CreateServiceAssignmentDto
    {
        [Required]
        public int ServiceRequestId { get; set; }

        [Required]
        public int TechnicianId { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class UpdateServiceAssignmentDto
    {
        public int? TechnicianId { get; set; }

        public string? Status { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class StartAssignmentDto
    {
        [MaxLength(500)]
        public string? Notes { get; set; }
    }

    public class CompleteAssignmentDto
    {
        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
