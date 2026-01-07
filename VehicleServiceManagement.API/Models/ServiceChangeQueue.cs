using System.Threading.Channels;
using VehicleServiceManagement.API.DTOs.Common;

namespace VehicleServiceManagement.API.Models
{
    public static class ServiceChangeQueue
    {
        public static Channel<ServiceChangeEvent> Channel =
            System.Threading.Channels.Channel.CreateUnbounded<ServiceChangeEvent>();
    }
}
