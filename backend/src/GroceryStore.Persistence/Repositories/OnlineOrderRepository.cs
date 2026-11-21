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

    public async Task CaptureAllocationsAsync(OnlineOrder order, string guestSessionId, CancellationToken cancellationToken)
    {
        var reservations = await context.InventoryReservations
            .Where(reservation => reservation.OwnerSessionId == guestSessionId && reservation.Status == GroceryStore.Domain.Enums.InventoryReservationStatus.Active)
            .ToListAsync(cancellationToken);
        foreach (var reservation in reservations)
        {
            var item = order.Items.SingleOrDefault(candidate => candidate.ProductVariantId == reservation.ProductVariantId)
                ?? throw new InvalidOperationException("Reservation does not match an online order item.");
            await context.OnlineOrderAllocations.AddAsync(new OnlineOrderAllocation(order.OnlineOrderId, item.OnlineOrderItemId, reservation.InventoryBatchId, reservation.Quantity), cancellationToken);
            reservation.Convert();
        }
    }

    public async Task ReleaseAllocationsAsync(OnlineOrder order, DateTime releasedAtUtc, CancellationToken cancellationToken)
    {
        var allocations = await context.OnlineOrderAllocations
            .Where(allocation => allocation.OnlineOrderId == order.OnlineOrderId)
            .ToListAsync(cancellationToken);

        foreach (var allocation in allocations)
        {
            var batch = await context.InventoryBatches.SingleOrDefaultAsync(candidate => candidate.InventoryBatchId == allocation.InventoryBatchId, cancellationToken)
                ?? throw new InvalidOperationException("Allocated inventory batch was not found.");
            batch.Adjust(allocation.Quantity);
            await context.InventoryTransactions.AddAsync(new InventoryTransaction(
                allocation.InventoryBatchId,
                order.Items.Single(item => item.OnlineOrderItemId == allocation.OnlineOrderItemId).ProductVariantId,
                GroceryStore.Domain.Enums.InventoryTransactionType.OnlineOrderCancellationRelease,
                allocation.Quantity,
                $"Cancelled online order {order.OrderCode} inventory released",
                releasedAtUtc), cancellationToken);
        }
    }

    public Task<OnlineOrder?> GetAccessibleAsync(Guid onlineOrderId, string guestSessionId, string? buyerUserId, CancellationToken cancellationToken) =>
        context.OnlineOrders.Include(order => order.Items).SingleOrDefaultAsync(order =>
            order.OnlineOrderId == onlineOrderId &&
            (order.GuestSessionId == guestSessionId || (buyerUserId != null && order.BuyerUserId == buyerUserId)), cancellationToken);

    public Task<OnlineOrder?> GetForManagementAsync(Guid onlineOrderId, CancellationToken cancellationToken) =>
        context.OnlineOrders.Include(order => order.Items).SingleOrDefaultAsync(order => order.OnlineOrderId == onlineOrderId, cancellationToken);

    public async Task<IReadOnlyList<OnlineOrder>> GetOrdersForManagementAsync(CancellationToken cancellationToken) =>
        await context.OnlineOrders
            .AsNoTracking()
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<OnlineOrder>> GetOrdersForBuyerAsync(string buyerUserId, CancellationToken cancellationToken) =>
        await context.OnlineOrders
            .AsNoTracking()
            .Where(order => order.BuyerUserId == buyerUserId)
            .OrderByDescending(order => order.CreatedAtUtc)
            .ToListAsync(cancellationToken);

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
