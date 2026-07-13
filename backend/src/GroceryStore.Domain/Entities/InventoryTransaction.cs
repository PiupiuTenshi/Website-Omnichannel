using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class InventoryTransaction
{
    private InventoryTransaction()
    {
        Reason = string.Empty;
    }

    public InventoryTransaction(Guid inventoryBatchId, Guid productVariantId, InventoryTransactionType type, decimal quantityDelta, string reason, DateTime occurredAtUtc)
    {
        if (quantityDelta == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantityDelta), "Inventory transaction quantity cannot be zero.");
        }

        InventoryTransactionId = Guid.NewGuid();
        InventoryBatchId = inventoryBatchId;
        ProductVariantId = productVariantId;
        Type = type;
        QuantityDelta = quantityDelta;
        Reason = reason;
        OccurredAtUtc = occurredAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid InventoryTransactionId { get; private set; }
    public Guid InventoryBatchId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public InventoryTransactionType Type { get; private set; }
    public decimal QuantityDelta { get; private set; }
    public string Reason { get; private set; }
    public DateTime OccurredAtUtc { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
}
