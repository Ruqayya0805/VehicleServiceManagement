using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VehicleServiceManagement.API.Services.Interfaces;

namespace VehicleServiceManagement.API.Services
{
    public class EmailNotificationBackgroundService : BackgroundService
    {
        private readonly ILogger<EmailNotificationBackgroundService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;

        public EmailNotificationBackgroundService(
            ILogger<EmailNotificationBackgroundService> logger,
            IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Email Notification Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var emailEvent = await EmailNotificationQueue.Channel.Reader.ReadAsync(stoppingToken);

                    _logger.LogInformation("Processing email notification: Type={Type} | To={To}", emailEvent.NotificationType, emailEvent.ToEmail);

                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                        await emailService.SendAsync(emailEvent);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing email notification.");
                }
            }

            _logger.LogInformation("Email Notification Background Service is stopping.");
        }
    }
}
