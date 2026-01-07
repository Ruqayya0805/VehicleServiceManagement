namespace VehicleServiceManagement.API.Models
{
    public class ServiceAssignment
    {
        public int AssignmentId { get; set; }
        public int ServiceRequestId { get; set; }
        public int TechnicianId { get; set; }
        public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
        public DateTime? StartedDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Status { get; set; } = "Assigned";
        public string? Notes { get; set; }

        public ServiceRequest ServiceRequest { get; set; } = null!;
        public User Technician { get; set; } = null!;
    }
}
