using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class ExpiryPolicy
{
    private ExpiryPolicy()
    {
        Name = string.Empty;
    }

    public ExpiryPolicy(Guid productVariantId, string name, ExpiryPolicyType type, int warningDaysBeforeExpiry)
    {
        ExpiryPolicyId = Guid.NewGuid();
        ProductVariantId = productVariantId;
        Name = name;
        Type = type;
        WarningDaysBeforeExpiry = warningDaysBeforeExpiry;
        CreatedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = CreatedAtUtc;
    }

    public Guid ExpiryPolicyId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public string Name { get; private set; }
    public ExpiryPolicyType Type { get; private set; }
    public int WarningDaysBeforeExpiry { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime UpdatedAtUtc { get; private set; }

    public bool IsWarningDue(InventoryBatch batch, DateTime utcNow)
    {
        return Type == ExpiryPolicyType.FreshProduce
            ? utcNow >= batch.ReceivedAtUtc.Date.AddDays(1).AddHours(6)
            : batch.ExpiresAtUtc is not null && utcNow >= batch.ExpiresAtUtc.Value.Date.AddDays(-WarningDaysBeforeExpiry);
    }

    public bool IsSaleBlocked(InventoryBatch batch, DateTime utcNow)
    {
        return Type == ExpiryPolicyType.FreshProduce
            ? utcNow >= batch.ReceivedAtUtc.Date.AddDays(1).AddHours(18)
            : batch.ExpiresAtUtc is not null && utcNow >= batch.ExpiresAtUtc.Value;
    }
}
