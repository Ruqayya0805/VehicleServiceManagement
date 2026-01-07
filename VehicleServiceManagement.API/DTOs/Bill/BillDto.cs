using System.ComponentModel.DataAnnotations;
using VehicleServiceManagement.API.DTOs.ServiceTask;

namespace VehicleServiceManagement.API.DTOs.Bill
{
    public class BillDto
    {
        public int BillId { get; set; }
        public string BillNumber { get; set; } = string.Empty;
        public int ServiceRequestId { get; set; }
        public string ServiceDescription { get; set; } = string.Empty;
        public string VehicleInfo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public int CustomerId { get; set; }
        public decimal ServiceCharge { get; set; }
        public decimal PartsCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal TaxPercentage { get; set; }
        public decimal Discount { get; set; }
        public decimal DiscountPercentage { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal BalanceDue { get; set; }
        public DateTime GeneratedDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public List<BillServiceItemDto> ServiceItems { get; set; } = new();
        public List<BillPartItemDto> PartItems { get; set; } = new();
        public List<BillPaymentDto> Payments { get; set; } = new();
        public List<ServiceTaskDto> Tasks { get; set; } = new();
    }

    public class BillServiceItemDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal OriginalPrice { get; set; }
        public decimal AdjustedPrice { get; set; }
    }

    public class BillPartItemDto
    {
        public int ServicePartId { get; set; }
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class BillPaymentDto
    {
        public int PaymentId { get; set; }
        public decimal AmountPaid { get; set; }
        public DateTime PaymentDate { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
    }

    public class GenerateBillDto
    {
        [Required]
        public int ServiceRequestId { get; set; }

        [Range(0, 100)]
        public decimal TaxPercentage { get; set; } = 10;

        [Range(0, double.MaxValue)]
        public decimal Discount { get; set; } = 0;

        public DateTime? DueDate { get; set; }

        /// <summary>
        /// Extra services added by service manager during billing
        /// </summary>
        public List<ExtraServiceDto>? ExtraServices { get; set; }
    }

    /// <summary>
    /// Extra service added during bill generation
    /// </summary>
    public class ExtraServiceDto
    {
        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Price { get; set; }
    }

    public class UpdateBillDto
    {
        [Range(0, double.MaxValue)]
        public decimal? ServiceCharge { get; set; }

        [Range(0, 100)]
        public decimal? TaxPercentage { get; set; }

        [Range(0, 100)]
        public decimal? DiscountPercentage { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? Discount { get; set; }

        public DateTime? DueDate { get; set; }

        /// <summary>
        /// Dictionary of CategoryId to adjusted price for individual service items
        /// </summary>
        public Dictionary<int, decimal>? ServiceItemPrices { get; set; }

        /// <summary>
        /// When true, closes the service request and finalizes the bill
        /// </summary>
        public bool FinalizeBill { get; set; } = false;
    }

    public class BillSummaryDto
    {
        public int BillId { get; set; }
        public string BillNumber { get; set; } = string.Empty;
        public int ServiceRequestId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string VehicleInfo { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal BalanceDue { get; set; }
        public DateTime GeneratedDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public bool IsClosed { get; set; }
        public bool IsOverdue => DueDate.HasValue && DueDate.Value < DateTime.UtcNow && BalanceDue > 0;
    }
}
