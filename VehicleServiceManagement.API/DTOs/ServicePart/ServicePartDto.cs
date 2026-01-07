using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.ServicePart
{
    public class ServicePartDto
    {
        public int ServicePartId { get; set; }
        public int ServiceRequestId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int QuantityUsed { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CreateServicePartDto
    {
        [Required]
        public int ServiceRequestId { get; set; }

        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int QuantityUsed { get; set; }
    }

    public class UpdateServicePartDto
    {
        [Range(1, int.MaxValue)]
        public int? QuantityUsed { get; set; }
    }

    public class AddPartToServiceDto
    {
        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
