using System.Threading.Channels;
using VehicleServiceManagement.API.DTOs.Notification;

namespace VehicleServiceManagement.API.Services
{
    public static class EmailNotificationQueue
    {
        public static readonly Channel<EmailNotificationEvent> Channel = 
            System.Threading.Channels.Channel.CreateUnbounded<EmailNotificationEvent>();
    }
}
