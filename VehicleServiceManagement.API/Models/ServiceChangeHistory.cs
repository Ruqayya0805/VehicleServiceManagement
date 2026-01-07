using System.ComponentModel.DataAnnotations;

namespace VehicleServiceManagement.API.Models
{
    public class ServiceChangeHistory
    {
        [Key]
        public int Id { get; set; }

        public int ServiceRequestId { get; set; }

        public string Action { get; set; } = string.Empty;  // Created, Updated, Assigned, Completed

        public string FieldName { get; set; } = string.Empty;

        public string OldValue { get; set; } = string.Empty;

        public string NewValue { get; set; } = string.Empty;

        public DateTime ChangedOn { get; set; } = DateTime.Now;
    }
}
