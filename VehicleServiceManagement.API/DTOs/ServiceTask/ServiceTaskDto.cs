using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServiceTask
{
    public class ServiceTaskDto
    {
        public int ServiceTaskId { get; set; }
        public int ServiceRequestId { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public int? CompletedByUserId { get; set; }
        public string? CompletedByName { get; set; }
        public decimal? Price { get; set; }
        public int OrderIndex { get; set; }
    }

    public class CreateAdditionalChargeDto
    {
        [Required]
        public int ServiceRequestId { get; set; }
        
        [Required]
        [StringLength(200, MinimumLength = 2)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }

    public class UpdateServiceTaskDto
    {
        public bool? IsCompleted { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal? Price { get; set; }
    }

    public class UpdateTaskPriceDto
    {
        [Required]
        public int ServiceTaskId { get; set; }
        
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
    }

    public class BulkUpdateTaskPricesDto
    {
        [Required]
        public List<UpdateTaskPriceDto> TaskPrices { get; set; } = new();
    }
}
