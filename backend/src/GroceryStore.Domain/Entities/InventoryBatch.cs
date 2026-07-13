using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class InventoryBatch
{
    private InventoryBatch()
    {
    }

    public InventoryBatch(Guid productVariantId, Guid? supplierId, decimal receivedQuantity, decimal unitCost, DateTime receivedAtUtc, DateTime? manufacturedAtUtc, DateTime? expiresAtUtc)
    {
        if (receivedQuantity <= 0 || unitCost < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(receivedQuantity), "Received quantity must be positive and unit cost cannot be negative.");
        }

        if (manufacturedAtUtc is not null && expiresAtUtc is not null && expiresAtUtc < manufacturedAtUtc)
        {
            throw new ArgumentException("Expiry time cannot be earlier than manufacturing time.", nameof(expiresAtUtc));
        }

        InventoryBatchId = Guid.NewGuid();
        ProductVariantId = productVariantId;
        SupplierId = supplierId;
        InitialQuantity = receivedQuantity;
        AvailableQuantity = receivedQuantity;
        UnitCost = unitCost;
        ReceivedAtUtc = receivedAtUtc;
        ManufacturedAtUtc = manufacturedAtUtc;
        ExpiresAtUtc = expiresAtUtc;
        Status = InventoryBatchStatus.Available;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid InventoryBatchId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public Guid? SupplierId { get; private set; }
    public decimal InitialQuantity { get; private set; }
    public decimal AvailableQuantity { get; private set; }
    public decimal UnitCost { get; private set; }
    public DateTime ReceivedAtUtc { get; private set; }
    public DateTime? ManufacturedAtUtc { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public InventoryBatchStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public void Allocate(decimal quantity, DateTime utcNow)
    {
        if (quantity <= 0 || quantity > AvailableQuantity || Status != InventoryBatchStatus.Available || (ExpiresAtUtc is not null && ExpiresAtUtc <= utcNow))
        {
            throw new InvalidOperationException("Batch cannot fulfill the requested allocation.");
        }

        AvailableQuantity -= quantity;
        if (AvailableQuantity == 0)
        {
            Status = InventoryBatchStatus.Depleted;
        }
    }

    public void Adjust(decimal quantityDelta)
    {
        if (AvailableQuantity + quantityDelta < 0)
        {
            throw new InvalidOperationException("Inventory cannot become negative.");
        }

        AvailableQuantity += quantityDelta;
        Status = AvailableQuantity == 0 ? InventoryBatchStatus.Depleted : InventoryBatchStatus.Available;
    }

    public void MarkExpired()
    {
        Status = InventoryBatchStatus.Expired;
    }
}
