using System;
using VehicleServiceManagement.API.Enums;

namespace VehicleServiceManagement.API.DTOs.Notification
{
    public class EmailNotificationEvent
    {
        public string ToEmail { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public NotificationType NotificationType { get; set; }
        public int? TriggeredByUserId { get; set; }
        public DateTime TriggeredOn { get; set; } = DateTime.UtcNow;
    }
}
