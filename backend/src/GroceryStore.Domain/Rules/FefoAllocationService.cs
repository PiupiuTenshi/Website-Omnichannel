using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Rules;

public static class FefoAllocationService
{
    public static IReadOnlyList<FefoAllocation> Allocate(IEnumerable<InventoryBatch> batches, decimal quantity, DateTime utcNow)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity));
        }

        var candidates = batches
            .Where(batch => batch.Status == InventoryBatchStatus.Available
                && batch.AvailableQuantity > 0
                && (batch.ExpiresAtUtc is null || batch.ExpiresAtUtc > utcNow))
            .OrderBy(batch => batch.ExpiresAtUtc ?? DateTime.MaxValue)
            .ThenBy(batch => batch.ReceivedAtUtc)
            .ToArray();
        if (candidates.Sum(batch => batch.AvailableQuantity) < quantity)
        {
            throw new InvalidOperationException("Available inventory is insufficient.");
        }

        var remaining = quantity;
        var allocations = new List<FefoAllocation>();
        foreach (var batch in candidates)
        {
            if (remaining == 0)
            {
                break;
            }

            var allocatedQuantity = decimal.Min(remaining, batch.AvailableQuantity);
            batch.Allocate(allocatedQuantity, utcNow);
            allocations.Add(new FefoAllocation(batch.InventoryBatchId, allocatedQuantity));
            remaining -= allocatedQuantity;
        }

        return allocations;
    }
}
