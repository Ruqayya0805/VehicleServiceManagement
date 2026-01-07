using Microsoft.EntityFrameworkCore;
using VehicleServiceManagement.API.Data;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.Enums;
using VehicleServiceManagement.API.Models;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    /// <summary>
    /// Service for managing in-app notifications (bell icon notifications)
    /// </summary>
    public class InAppNotificationService : IInAppNotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<InAppNotificationService> _logger;

        public InAppNotificationService(ApplicationDbContext context, ILogger<InAppNotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<InAppNotification> CreateForUserAsync(
            int targetUserId,
            string title,
            string message,
            InAppNotificationType type,
            int? createdByUserId = null,
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string? actionUrl = null)
        {
            var notification = new InAppNotification
            {
                Id = Guid.NewGuid(),
                Title = title,
                Message = message,
                Type = type,
                TargetUserId = targetUserId,
                TargetRole = null,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                RelatedEntityId = relatedEntityId,
                RelatedEntityType = relatedEntityType,
                ActionUrl = actionUrl
            };

            await _context.InAppNotifications.AddAsync(notification);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created notification for user {UserId}: {Title}", targetUserId, title);
            
            return notification;
        }

        public async Task<List<InAppNotification>> CreateForRoleAsync(
            string targetRole,
            string title,
            string message,
            InAppNotificationType type,
            int? createdByUserId = null,
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string? actionUrl = null)
        {
            var usersWithRole = await _context.Users
                .Where(u => u.Role == targetRole && u.IsActive && u.IsEmailVerified)
                .Select(u => u.UserId)
                .ToListAsync();

            var notifications = new List<InAppNotification>();

            foreach (var userId in usersWithRole)
            {
                var notification = new InAppNotification
                {
                    Id = Guid.NewGuid(),
                    Title = title,
                    Message = message,
                    Type = type,
                    TargetUserId = userId,
                    TargetRole = targetRole,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = createdByUserId,
                    RelatedEntityId = relatedEntityId,
                    RelatedEntityType = relatedEntityType,
                    ActionUrl = actionUrl
                };
                notifications.Add(notification);
            }

            if (notifications.Any())
            {
                await _context.InAppNotifications.AddRangeAsync(notifications);
                await _context.SaveChangesAsync();
            }

            _logger.LogInformation("Created {Count} notifications for role {Role}: {Title}", 
                notifications.Count, targetRole, title);

            return notifications;
        }

        public async Task<NotificationListDto> GetUserNotificationsAsync(
            int userId,
            string userRole,
            int skip = 0,
            int take = 20,
            bool unreadOnly = false)
        {
            var query = _context.InAppNotifications
                .Where(n => n.TargetUserId == userId)
                .AsQueryable();

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            var totalCount = await query.CountAsync();
            var unreadCount = await query.Where(n => !n.IsRead).CountAsync();

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip(skip)
                .Take(take)
                .Include(n => n.CreatedByUser)
                .ToListAsync();

            return new NotificationListDto
            {
                Notifications = notifications.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                UnreadCount = unreadCount
            };
        }

        public async Task<int> GetUnreadCountAsync(int userId, string userRole)
        {
            return await _context.InAppNotifications
                .Where(n => n.TargetUserId == userId && !n.IsRead)
                .CountAsync();
        }

        public async Task<bool> MarkAsReadAsync(Guid notificationId, int userId, string userRole)
        {
            var notification = await _context.InAppNotifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.TargetUserId == userId);

            if (notification == null)
            {
                return false;
            }

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<int> MarkAllAsReadAsync(int userId, string userRole)
        {
            var unreadNotifications = await _context.InAppNotifications
                .Where(n => n.TargetUserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return unreadNotifications.Count;
        }

        public async Task<int> DeleteOldNotificationsAsync(int daysOld = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
            
            var oldNotifications = await _context.InAppNotifications
                .Where(n => n.CreatedAt < cutoffDate && n.IsRead)
                .ToListAsync();

            _context.InAppNotifications.RemoveRange(oldNotifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted {Count} old notifications", oldNotifications.Count);

            return oldNotifications.Count;
        }

        public async Task<int> DeleteAllForUserAsync(int userId)
        {
            var notifications = await _context.InAppNotifications
                .Where(n => n.TargetUserId == userId)
                .ToListAsync();

            _context.InAppNotifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted {Count} notifications for user {UserId} due to role change", notifications.Count, userId);

            return notifications.Count;
        }

        private static NotificationDto MapToDto(InAppNotification n)
        {
            return new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type.ToString(),
                TypeIcon = GetTypeIcon(n.Type),
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                TimeAgo = GetTimeAgo(n.CreatedAt),
                RelatedEntityId = n.RelatedEntityId,
                RelatedEntityType = n.RelatedEntityType,
                ActionUrl = n.ActionUrl,
                CreatedByName = n.CreatedByUser != null 
                    ? $"{n.CreatedByUser.FirstName} {n.CreatedByUser.LastName}" 
                    : null
            };
        }

        private static string GetTypeIcon(InAppNotificationType type)
        {
            return type switch
            {
                InAppNotificationType.ServiceRequestCreated => "bi-plus-circle",
                InAppNotificationType.ServiceRequestUpdated => "bi-pencil-square",
                InAppNotificationType.ServiceRequestCancelled => "bi-x-circle",
                InAppNotificationType.ServiceRequestCompleted => "bi-check-circle",
                InAppNotificationType.TechnicianAssigned => "bi-person-plus",
                InAppNotificationType.AssignmentStarted => "bi-play-circle",
                InAppNotificationType.AssignmentCompleted => "bi-check2-circle",
                InAppNotificationType.BillGenerated => "bi-receipt",
                InAppNotificationType.PaymentReceived => "bi-cash-coin",
                InAppNotificationType.PaymentOverdue => "bi-exclamation-triangle",
                InAppNotificationType.PartOrderCreated => "bi-box-seam",
                InAppNotificationType.PartOrderReceived => "bi-box2-heart",
                InAppNotificationType.LowStockAlert => "bi-exclamation-circle",
                InAppNotificationType.AccountApproved => "bi-person-check",
                InAppNotificationType.AccountRejected => "bi-person-x",
                InAppNotificationType.PasswordChanged => "bi-key",
                InAppNotificationType.SystemAlert => "bi-info-circle",
                InAppNotificationType.Reminder => "bi-clock",
                _ => "bi-bell"
            };
        }

        private static string GetTimeAgo(DateTime createdAt)
        {
            var timeSpan = DateTime.UtcNow - createdAt;

            if (timeSpan.TotalMinutes < 1)
                return "Just now";
            if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes}m ago";
            if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours}h ago";
            if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays}d ago";
            if (timeSpan.TotalDays < 30)
                return $"{(int)(timeSpan.TotalDays / 7)}w ago";
            
            return createdAt.ToString("MMM dd");
        }
    }
}
