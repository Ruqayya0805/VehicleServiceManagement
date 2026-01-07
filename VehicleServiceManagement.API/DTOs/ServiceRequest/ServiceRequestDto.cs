using System.ComponentModel.DataAnnotations;
using VehicleServiceManagement.API.DTOs.ServiceTask;

namespace VehicleServiceManagement.API.DTOs.ServiceRequest
{
    public class ServiceRequestDto
    {
        public int ServiceRequestId { get; set; }
        public int VehicleId { get; set; }
        public string VehicleInfo { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public List<ServiceCategoryInfoDto> SelectedServices { get; set; } = new List<ServiceCategoryInfoDto>();
        public List<ServiceTaskDto> Tasks { get; set; } = new List<ServiceTaskDto>();
        public string IssueDescription { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedDate { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? CustomerRemarks { get; set; }
        public string? TechnicianRemarks { get; set; }
        public decimal EstimatedCost { get; set; }
        public decimal ActualCost { get; set; }
        public ServiceAssignmentInfoDto? Assignment { get; set; }
        public bool HasBill { get; set; }
    }

    public class ServiceAssignmentInfoDto
    {
        public int AssignmentId { get; set; }
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public DateTime AssignedDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class CreateServiceRequestDto
    {
        [Required]
        public int VehicleId { get; set; }

        /// <summary>
        /// Single category ID (for backward compatibility)
        /// </summary>
        public int? CategoryId { get; set; }

        /// <summary>
        /// Multiple category IDs for booking multiple services at once
        /// </summary>
        public List<int>? CategoryIds { get; set; }

        [Required]
        [MaxLength(1000)]
        public string IssueDescription { get; set; } = string.Empty;

        public string Priority { get; set; } = "Normal";

        public DateTime? ScheduledDate { get; set; }

        [MaxLength(500)]
        public string? CustomerRemarks { get; set; }
    }

    public class UpdateServiceRequestDto
    {
        public string? Status { get; set; }
        public DateTime? ScheduledDate { get; set; }
        
        [MaxLength(500)]
        public string? TechnicianRemarks { get; set; }
        
        [MaxLength(500)]
        public string? CustomerRemarks { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? ActualCost { get; set; }

        public int? CategoryId { get; set; }

        public string? Priority { get; set; }
    }

    public class AssignTechnicianDto
    {
        [Required]
        public int TechnicianId { get; set; }

        public string? Notes { get; set; }

        public DateTime? ScheduledDate { get; set; }
    }

    public class CompleteServiceDto
    {
        [MaxLength(500)]
        public string? TechnicianRemarks { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? ActualCost { get; set; }
    }

    public class CancelServiceDto
    {
        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }

    public class RescheduleServiceDto
    {
        [Required]
        public DateTime NewDate { get; set; }
    }

    public class ServiceRequestFilterDto
    {
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public int? CustomerId { get; set; }
        public int? TechnicianId { get; set; }
        public int? CategoryId { get; set; }
        public int? VehicleId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ServiceCategoryInfoDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
    }
}
