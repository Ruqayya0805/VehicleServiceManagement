using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    /// <summary>
    /// Service interface for managing in-app notifications (bell icon notifications)
    /// </summary>
    public interface IInAppNotificationService
    {
        /// <summary>
        /// Create a notification for a specific user
        /// </summary>
        Task<InAppNotification> CreateForUserAsync(
            int targetUserId,
            string title,
            string message,
            InAppNotificationType type,
            int? createdByUserId = null,
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string? actionUrl = null);

        /// <summary>
        /// Create notifications for all users with a specific role
        /// </summary>
        Task<List<InAppNotification>> CreateForRoleAsync(
            string targetRole,
            string title,
            string message,
            InAppNotificationType type,
            int? createdByUserId = null,
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string? actionUrl = null);

        /// <summary>
        /// Get notifications for a user (both user-specific and role-based)
        /// </summary>
        Task<NotificationListDto> GetUserNotificationsAsync(
            int userId,
            string userRole,
            int skip = 0,
            int take = 20,
            bool unreadOnly = false);

        /// <summary>
        /// Get unread notification count for a user
        /// </summary>
        Task<int> GetUnreadCountAsync(int userId, string userRole);

        /// <summary>
        /// Mark a specific notification as read
        /// </summary>
        Task<bool> MarkAsReadAsync(Guid notificationId, int userId, string userRole);

        /// <summary>
        /// Mark all notifications as read for a user
        /// </summary>
        Task<int> MarkAllAsReadAsync(int userId, string userRole);

        /// <summary>
        /// Delete all notifications for a user (used when role changes)
        /// </summary>
        Task<int> DeleteAllForUserAsync(int userId);

        /// <summary>
        /// Delete old notifications (for cleanup)
        /// </summary>
        Task<int> DeleteOldNotificationsAsync(int daysOld = 30);
    }
}
