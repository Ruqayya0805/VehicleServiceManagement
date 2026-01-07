using VehicleServiceManagement.API.Data;
using VehicleServiceManagement.API.Models;

namespace VehicleServiceManagement.API.Services
{
    public class ServiceChangeBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public ServiceChangeBackgroundService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("ServiceChangeBackgroundService STARTED");

            await foreach (var evt in ServiceChangeQueue.Channel.Reader.ReadAllAsync(stoppingToken))
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                foreach (var change in evt.Changes)
                {
                    db.ServiceChangeHistories.Add(new ServiceChangeHistory
                    {
                        ServiceRequestId = evt.ServiceRequestId,
                        Action = evt.Action,
                        FieldName = change.Key,
                        OldValue = change.Value.OldValue,
                        NewValue = change.Value.NewValue
                    });

                    Console.WriteLine(
                        $"{evt.Action} | ServiceId {evt.ServiceRequestId} | {change.Key}: {change.Value.OldValue} ? {change.Value.NewValue}"
                    );
                }

                await db.SaveChangesAsync();
            }
        }
    }
}
