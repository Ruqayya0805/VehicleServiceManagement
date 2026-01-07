namespace VehicleServiceManagement.API.Models
{
    /// <summary>
    /// Represents an order placed for parts from a supplier
    /// </summary>
    public class PartOrder
    {
        public int PartOrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int PartId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? DeliveredDate { get; set; }
        public int OrderedByUserId { get; set; }
        public string Notes { get; set; } = string.Empty;
        public Part Part { get; set; } = null!;
        public User OrderedBy { get; set; } = null!;
    }
}
