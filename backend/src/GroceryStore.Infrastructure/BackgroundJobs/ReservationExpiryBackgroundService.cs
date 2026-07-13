using GroceryStore.Application.Features.Orders;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace GroceryStore.Infrastructure.BackgroundJobs;

public sealed class ReservationExpiryBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<ReservationExpiryBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan POLLING_INTERVAL = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(POLLING_INTERVAL);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var reservationService = scope.ServiceProvider.GetRequiredService<InventoryReservationService>();
                var releasedCount = await reservationService.ReleaseExpiredReservationsAsync(stoppingToken);
                if (releasedCount > 0)
                {
                    logger.LogInformation("Released {ReservationCount} expired online inventory reservations.", releasedCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to release expired online inventory reservations.");
            }
        }
    }
}
