namespace VehicleServiceManagement.API.Models
{
    public class ServiceRequest
    {
        public int ServiceRequestId { get; set; }
        public int VehicleId { get; set; }
        public int CustomerId { get; set; }
        public int? CategoryId { get; set; }
        public string IssueDescription { get; set; } = string.Empty;
        public string Priority { get; set; } = "Normal";
        public string Status { get; set; } = "Requested";
        public DateTime RequestedDate { get; set; } = DateTime.UtcNow;
        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? CustomerRemarks { get; set; }
        public string? TechnicianRemarks { get; set; }
        public decimal EstimatedCost { get; set; }
        public decimal ActualCost { get; set; }

        public Vehicle Vehicle { get; set; } = null!;
        public User Customer { get; set; } = null!;
        public ServiceCategory? Category { get; set; }
        public ICollection<ServiceRequestCategory> ServiceRequestCategories { get; set; } = new List<ServiceRequestCategory>();
        public ICollection<ServiceTask> ServiceTasks { get; set; } = new List<ServiceTask>();
        public ServiceAssignment? ServiceAssignment { get; set; }
        public ICollection<ServicePart> ServiceParts { get; set; } = new List<ServicePart>();
        public Bill? Bill { get; set; }
    }
}