using VehicleServiceManagement.API.Enums;

namespace VehicleServiceManagement.API.Models
{
    /// <summary>
    /// In-app notification entity for the notification bell system
    /// </summary>
    public class InAppNotification
    {
        /// <summary>
        /// Unique identifier (GUID for better distribution)
        /// </summary>
        public Guid Id { get; set; } = Guid.NewGuid();
        
        /// <summary>
        /// Short notification title
        /// </summary>
        public string Title { get; set; } = string.Empty;
        
        /// <summary>
        /// Detailed notification message
        /// </summary>
        public string Message { get; set; } = string.Empty;
        
        /// <summary>
        /// Type of notification for categorization and icon display
        /// </summary>
        public InAppNotificationType Type { get; set; }
        
        /// <summary>
        /// Target user ID (for user-specific notifications)
        /// Either TargetUserId OR TargetRole must be set
        /// </summary>
        public int? TargetUserId { get; set; }
        
        /// <summary>
        /// Target role (for role-based notifications)
        /// Either TargetUserId OR TargetRole must be set
        /// </summary>
        public string? TargetRole { get; set; }
        
        /// <summary>
        /// Whether the notification has been read
        /// </summary>
        public bool IsRead { get; set; } = false;
        
        /// <summary>
        /// When the notification was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        /// <summary>
        /// User who triggered this notification (optional)
        /// </summary>
        public int? CreatedByUserId { get; set; }
        
        /// <summary>
        /// Related entity ID for navigation (e.g., ServiceRequestId)
        /// </summary>
        public int? RelatedEntityId { get; set; }
        
        /// <summary>
        /// Type of related entity for routing (e.g., "ServiceRequest", "Bill")
        /// </summary>
        public string? RelatedEntityType { get; set; }
        
        /// <summary>
        /// URL/route to navigate to when notification is clicked
        /// </summary>
        public string? ActionUrl { get; set; }
        public User? TargetUser { get; set; }
        public User? CreatedByUser { get; set; }
    }
}
