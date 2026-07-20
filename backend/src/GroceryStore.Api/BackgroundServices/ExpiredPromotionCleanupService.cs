using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Api.BackgroundServices;

public sealed class ExpiredPromotionCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<ExpiredPromotionCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan CHECK_INTERVAL = TimeSpan.FromSeconds(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RestoreExpiredPricesAsync(stoppingToken);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Unable to restore expired promotion prices.");
            }

            await Task.Delay(CHECK_INTERVAL, stoppingToken);
        }
    }

    private async Task RestoreExpiredPricesAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var nowUtc = DateTime.UtcNow;
        var expiredVariants = await context.ProductVariants
            .Where(variant => variant.CompareAtPrice != null
                && variant.PromotionEndAtUtc != null
                && variant.PromotionEndAtUtc <= nowUtc)
            .ToArrayAsync(cancellationToken);

        if (expiredVariants.Length == 0)
        {
            return;
        }

        foreach (var variant in expiredVariants)
        {
            variant.Update(
                variant.Name,
                variant.Sku,
                variant.Barcode,
                variant.CompareAtPrice!.Value,
                null,
                variant.IsActive,
                null,
                null);
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Restored prices for {PromotionCount} expired promotion variants.", expiredVariants.Length);
    }
}
