namespace VehicleServiceManagement.API.Models
{
    public class Bill
    {
        public int BillId { get; set; }
        public int ServiceRequestId { get; set; }
        public decimal ServiceCharge { get; set; }
        public decimal PartsCharge { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime GeneratedDate { get; set; } = DateTime.UtcNow;
        public string BillNumber { get; set; } = string.Empty;

        public ServiceRequest ServiceRequest { get; set; } = null!;
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}