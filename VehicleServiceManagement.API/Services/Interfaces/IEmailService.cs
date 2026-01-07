using System.Threading.Tasks;
using VehicleServiceManagement.API.DTOs.Notification;

namespace VehicleServiceManagement.API.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendAsync(EmailNotificationEvent emailEvent);
    }
}
