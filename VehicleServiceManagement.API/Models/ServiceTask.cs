namespace VehicleServiceManagement.API.Models
{
    /// <summary>
    /// Represents an individual task parsed from the customer's issue description.
    /// Each comma-separated item becomes a task that technicians can complete.
    /// </summary>
    public class ServiceTask
    {
        public int ServiceTaskId { get; set; }
        public int ServiceRequestId { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedDate { get; set; }
        public int? CompletedByUserId { get; set; }
        public decimal? Price { get; set; }
        public int OrderIndex { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        public ServiceRequest ServiceRequest { get; set; } = null!;
        public User? CompletedBy { get; set; }
    }
}
