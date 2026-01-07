using VehicleServiceManagement.API.Enums;

namespace VehicleServiceManagement.API.DTOs.Notification
{
    /// <summary>
    /// DTO for displaying notifications to users
    /// </summary>
    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string TypeIcon { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string TimeAgo { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string? ActionUrl { get; set; }
        public string? CreatedByName { get; set; }
    }

    /// <summary>
    /// DTO for creating a new notification
    /// </summary>
    public class CreateNotificationDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public InAppNotificationType Type { get; set; }
        public int? TargetUserId { get; set; }
        public string? TargetRole { get; set; }
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string? ActionUrl { get; set; }
    }

    /// <summary>
    /// Response for unread count
    /// </summary>
    public class UnreadCountDto
    {
        public int Count { get; set; }
    }

    /// <summary>
    /// Response for notification list with pagination
    /// </summary>
    public class NotificationListDto
    {
        public List<NotificationDto> Notifications { get; set; } = new();
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
    }
}
