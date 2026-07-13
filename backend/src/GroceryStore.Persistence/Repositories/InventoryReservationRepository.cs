using GroceryStore.Application.Abstractions.Persistence;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Repositories;

public sealed class InventoryReservationRepository(ApplicationDbContext context) : IInventoryReservationRepository
{
    public async Task<IReadOnlyList<InventoryBatch>> GetActiveBatchesAsync(Guid productVariantId, CancellationToken cancellationToken)
    {
        return await context.InventoryBatches
            .Where(batch => batch.ProductVariantId == productVariantId && batch.Status == InventoryBatchStatus.Available)
            .ToListAsync(cancellationToken);
    }

    public Task<InventoryBatch?> GetBatchAsync(Guid inventoryBatchId, CancellationToken cancellationToken) =>
        context.InventoryBatches.SingleOrDefaultAsync(batch => batch.InventoryBatchId == inventoryBatchId, cancellationToken);

    public async Task<IReadOnlyList<InventoryReservation>> GetActiveReservationsAsync(string ownerSessionId, CancellationToken cancellationToken)
    {
        return await context.InventoryReservations
            .Where(reservation => reservation.OwnerSessionId == ownerSessionId && reservation.Status == InventoryReservationStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<InventoryReservation>> GetExpiredReservationsAsync(DateTime utcNow, CancellationToken cancellationToken)
    {
        return await context.InventoryReservations
            .Where(reservation => reservation.Status == InventoryReservationStatus.Active && reservation.ExpiresAtUtc <= utcNow)
            .ToListAsync(cancellationToken);
    }

    public Task AddReservationAsync(InventoryReservation reservation, CancellationToken cancellationToken) => context.InventoryReservations.AddAsync(reservation, cancellationToken).AsTask();

    public Task AddTransactionAsync(InventoryTransaction transaction, CancellationToken cancellationToken) => context.InventoryTransactions.AddAsync(transaction, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken) => context.SaveChangesAsync(cancellationToken);

    public async Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken)
    {
        var strategy = context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action();
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
}
