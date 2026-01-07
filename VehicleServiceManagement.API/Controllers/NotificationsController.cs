using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using VehicleServiceManagement.API.DTOs.Common;
using VehicleServiceManagement.API.DTOs.Notification;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly IInAppNotificationService _notificationService;

        public NotificationsController(IInAppNotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        /// <summary>
        /// Get notifications for the current user
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<NotificationListDto>), 200)]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 20,
            [FromQuery] bool unreadOnly = false)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var result = await _notificationService.GetUserNotificationsAsync(
                userId, userRole, skip, take, unreadOnly);

            return Ok(new ApiResponse<NotificationListDto>
            {
                Success = true,
                Message = "Notifications retrieved successfully",
                Data = result
            });
        }

        /// <summary>
        /// Get unread notification count for the current user
        /// </summary>
        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(ApiResponse<UnreadCountDto>), 200)]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var count = await _notificationService.GetUnreadCountAsync(userId, userRole);

            return Ok(new ApiResponse<UnreadCountDto>
            {
                Success = true,
                Message = "Unread count retrieved",
                Data = new UnreadCountDto { Count = count }
            });
        }

        /// <summary>
        /// Mark a specific notification as read
        /// </summary>
        [HttpPost("{id}/read")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var result = await _notificationService.MarkAsReadAsync(id, userId, userRole);

            if (!result)
            {
                return NotFound(new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Notification not found or access denied"
                });
            }

            return Ok(new ApiResponse<bool>
            {
                Success = true,
                Message = "Notification marked as read",
                Data = true
            });
        }

        /// <summary>
        /// Mark all notifications as read for the current user
        /// </summary>
        [HttpPost("read-all")]
        [ProducesResponseType(typeof(ApiResponse<int>), 200)]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var count = await _notificationService.MarkAllAsReadAsync(userId, userRole);

            return Ok(new ApiResponse<int>
            {
                Success = true,
                Message = $"Marked {count} notifications as read",
                Data = count
            });
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }
    }
}
