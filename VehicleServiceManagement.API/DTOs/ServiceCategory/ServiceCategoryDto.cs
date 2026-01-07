using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServiceCategory
{
    public class ServiceCategoryDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public int EstimatedDurationMinutes { get; set; }
        public bool IsActive { get; set; }
        public int TotalServiceRequests { get; set; }
    }

    public class CreateServiceCategoryDto
    {
        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal BasePrice { get; set; }

        [Required]
        [Range(1, 10080)] 
        public int EstimatedDurationMinutes { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateServiceCategoryDto
    {
        [MaxLength(100)]
        public string? CategoryName { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? BasePrice { get; set; }

        [Range(1, 10080)]
        public int? EstimatedDurationMinutes { get; set; }

        public bool? IsActive { get; set; }
    }
}
