using GroceryStore.Persistence.Context;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace GroceryStore.Api.Health;

public sealed class DatabaseReadinessCheck(IServiceScopeFactory scopeFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await database.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Database connection is unavailable.");
    }
}
