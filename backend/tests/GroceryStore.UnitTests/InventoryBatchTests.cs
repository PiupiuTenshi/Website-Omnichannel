using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Enums;

namespace GroceryStore.UnitTests;

public sealed class InventoryBatchTests
{
    [Fact]
    public void Allocate_RejectsQuantityGreaterThanAvailable()
    {
        var batch = CreateBatch(2m);
        Assert.Throws<InvalidOperationException>(() => batch.Allocate(2.1m, DateTime.UtcNow));
    }

    [Fact]
    public void Allocate_DepletesBatchWithoutMakingStockNegative()
    {
        var batch = CreateBatch(2m);
        batch.Allocate(2m, DateTime.UtcNow);
        Assert.Equal(0m, batch.AvailableQuantity);
        Assert.Equal(InventoryBatchStatus.Depleted, batch.Status);
    }

    [Fact]
    public void FreshProducePolicy_WarnsAndBlocksAtRequiredTimes()
    {
        var receivedAtUtc = new DateTime(2026, 7, 12, 10, 0, 0, DateTimeKind.Utc);
        var batch = new InventoryBatch(Guid.NewGuid(), null, 1m, 10000m, receivedAtUtc, null, null);
        var policy = new ExpiryPolicy(Guid.NewGuid(), "Fresh produce", ExpiryPolicyType.FreshProduce, 0);

        Assert.True(policy.IsWarningDue(batch, receivedAtUtc.Date.AddDays(1).AddHours(6)));
        Assert.False(policy.IsSaleBlocked(batch, receivedAtUtc.Date.AddDays(1).AddHours(17).AddMinutes(59)));
        Assert.True(policy.IsSaleBlocked(batch, receivedAtUtc.Date.AddDays(1).AddHours(18)));
    }

    private static InventoryBatch CreateBatch(decimal quantity)
    {
        return new InventoryBatch(Guid.NewGuid(), null, quantity, 10000m, DateTime.UtcNow, null, DateTime.UtcNow.AddDays(7));
    }
}
