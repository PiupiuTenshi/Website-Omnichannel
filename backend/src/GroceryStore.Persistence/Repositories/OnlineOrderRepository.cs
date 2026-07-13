using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class OnlineOrderRepository(ApplicationDbContext context) : IOnlineOrderRepository
{
    public Task<bool> IsOnlineOrderingEnabledAsync(CancellationToken cancellationToken) =>
        context.StoreSettings.AsNoTracking().Select(settings => settings.IsOnlineOrderingEnabled).SingleOrDefaultAsync(cancellationToken);

    public Task AddAsync(OnlineOrder order, CancellationToken cancellationToken) => context.OnlineOrders.AddAsync(order, cancellationToken).AsTask();

    public Task<OnlineOrder?> GetAccessibleAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, CancellationToken cancellationToken) =>
        context.OnlineOrders.Include(order => order.Items).SingleOrDefaultAsync(order =>
            order.OnlineOrderId == onlineOrderId &&
            (order.GuestSessionId == guestSessionId || (buyerUserId != null && order.BuyerUserId == buyerUserId)), cancellationToken);

    public Task<OnlineOrder?> GetForManagementAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        context.OnlineOrders.Include(order => order.Items).SingleOrDefaultAsync(order => order.OnlineOrderId == onlineOrderId, cancellationToken);

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try { await action(); await transaction.CommitAsync(cancellationToken); }
            catch { await transaction.RollbackAsync(cancellationToken); throw; }
        });
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => context.SaveChangesAsync(cancellationToken);
}
