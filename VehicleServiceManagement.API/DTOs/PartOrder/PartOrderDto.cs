using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.DTOs.PartOrder
{
    public class PartOrderDto
    {
        public int PartOrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public int OrderedByUserId { get; set; }
        public string OrderedByName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public int CurrentStock { get; set; }
        public int ReorderLevel { get; set; }
    }

    public class CreatePartOrderDto
    {
        [Required]
        public int PartId { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? UnitPrice { get; set; }

        public DateTime? ExpectedDeliveryDate { get; set; }

        public string Notes { get; set; } = string.Empty;
    }

    public class UpdatePartOrderDto
    {
        public string? Status { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public string? Notes { get; set; }
    }

    public class PartOrderSummaryDto
    {
        public int PartOrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string PartName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal TotalAmount { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
    }
}
