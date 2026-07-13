using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IInventoryReservationRepository
{
    Task<IReadOnlyList<InventoryBatch>> GetActiveBatchesAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task<InventoryBatch?> GetBatchAsync(Guid inventoryBatchId, CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryReservation>> GetActiveReservationsAsync(string ownerSessionId, CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryReservation>> GetExpiredReservationsAsync(DateTime utcNow, CancellationToken cancellationToken);

    Task AddReservationAsync(InventoryReservation reservation, CancellationToken cancellationToken);

    Task AddTransactionAsync(InventoryTransaction transaction, CancellationToken cancellationToken);

    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
