namespace VehicleServiceManagement.API.Models
{
    public class Part
    {
        public int PartId { get; set; }
        public string PartName { get; set; } = string.Empty;
        public string PartNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int QuantityInStock { get; set; }
        public int ReorderLevel { get; set; }
        public string Supplier { get; set; } = string.Empty;

        public ICollection<ServicePart> ServiceParts { get; set; } = new List<ServicePart>();
    }
}