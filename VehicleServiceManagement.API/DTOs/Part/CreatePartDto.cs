using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Part
{
    public class CreatePartDto
    {
        [Required]
        public string PartName { get; set; } = string.Empty;

        [Required]
        public string PartNumber { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal UnitPrice { get; set; }

        [Required]
        [Range(0, int.MaxValue)]
        public int QuantityInStock { get; set; }

        [Range(0, int.MaxValue)]
        public int ReorderLevel { get; set; }

        public string Supplier { get; set; } = string.Empty;
    }
}
