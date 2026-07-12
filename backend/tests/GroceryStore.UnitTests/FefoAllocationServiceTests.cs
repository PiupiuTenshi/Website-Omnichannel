using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Rules;

namespace GroceryStore.UnitTests;

public sealed class FefoAllocationServiceTests
{
    [Fact]
    public void Allocate_PrefersNearestValidExpiry()
    {
        var utcNow = new DateTime(2026, 7, 12, 8, 0, 0, DateTimeKind.Utc);
        var later = CreateBatch(5m, utcNow.AddDays(4));
        var earlier = CreateBatch(5m, utcNow.AddDays(2));

        var allocations = FefoAllocationService.Allocate([later, earlier], 6m, utcNow);

        Assert.Equal(earlier.InventoryBatchId, allocations[0].InventoryBatchId);
        Assert.Equal(5m, allocations[0].Quantity);
        Assert.Equal(later.InventoryBatchId, allocations[1].InventoryBatchId);
        Assert.Equal(1m, allocations[1].Quantity);
    }

    [Fact]
    public void Allocate_ExcludesExpiredBatch()
    {
        var utcNow = DateTime.UtcNow;
        var expired = CreateBatch(5m, utcNow.AddMinutes(-1));
        var valid = CreateBatch(5m, utcNow.AddDays(1));

        var allocations = FefoAllocationService.Allocate([expired, valid], 5m, utcNow);

        Assert.Single(allocations);
        Assert.Equal(valid.InventoryBatchId, allocations[0].InventoryBatchId);
    }

    private static InventoryBatch CreateBatch(decimal quantity, DateTime expiresAtUtc)
    {
        return new InventoryBatch(Guid.NewGuid(), null, quantity, 10000m, DateTime.UtcNow, null, expiresAtUtc);
    }
}
