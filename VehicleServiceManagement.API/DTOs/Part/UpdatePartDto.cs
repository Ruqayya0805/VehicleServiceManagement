using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.Part
{
    public class UpdatePartDto
    {
        [MaxLength(100)]
        public string? PartName { get; set; }

        [MaxLength(50)]
        public string? PartNumber { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? UnitPrice { get; set; }

        [Range(0, int.MaxValue)]
        public int? QuantityInStock { get; set; }

        [Range(0, int.MaxValue)]
        public int? ReorderLevel { get; set; }

        [MaxLength(100)]
        public string? Supplier { get; set; }
    }

    public class RestockPartDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }

        public string? Notes { get; set; }
    }

    public class LowStockPartDto
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int QuantityInStock { get; set; }
        public int ReorderLevel { get; set; }
        public int QuantityToReorder { get; set; }
        public string Supplier { get; set; } = string.Empty;
    }
}
