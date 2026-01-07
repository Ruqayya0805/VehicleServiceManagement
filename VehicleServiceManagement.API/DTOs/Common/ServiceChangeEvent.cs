namespace VehicleServiceManagement.API.DTOs.Common
{
    public class ServiceChangeEvent
    {
        public int ServiceRequestId { get; set; }
        public string Action { get; set; } = string.Empty;
        public Dictionary<string, (string OldValue, string NewValue)> Changes { get; set; }
            = new Dictionary<string, (string, string)>();
    }
}