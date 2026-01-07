namespace VehicleServiceManagement.API.Models
{
    public class ServicePart
    {
        public int ServicePartId { get; set; }
        public int ServiceRequestId { get; set; }
        public int PartId { get; set; }
        public int QuantityUsed { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        public ServiceRequest ServiceRequest { get; set; } = null!;
        public Part Part { get; set; } = null!;
    }
}