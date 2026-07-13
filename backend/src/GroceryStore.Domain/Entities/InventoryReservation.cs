using GroceryStore.Domain.Enums;

namespace GroceryStore.Domain.Entities;

public sealed class InventoryReservation
{
    private InventoryReservation()
    {
        OwnerSessionId = string.Empty;
    }

    public InventoryReservation(Guid inventoryBatchId, Guid productVariantId, string ownerSessionId, decimal quantity, DateTime expiresAtUtc, DateTime createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(ownerSessionId))
        {
            throw new ArgumentException("Reservation owner session is required.", nameof(ownerSessionId));
        }

        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Reservation quantity must be positive.");
        }

        if (expiresAtUtc <= createdAtUtc)
        {
            throw new ArgumentOutOfRangeException(nameof(expiresAtUtc), "Reservation expiry must be in the future.");
        }

        InventoryReservationId = Guid.NewGuid();
        InventoryBatchId = inventoryBatchId;
        ProductVariantId = productVariantId;
        OwnerSessionId = ownerSessionId;
        Quantity = quantity;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = createdAtUtc;
        Status = InventoryReservationStatus.Active;
    }

    public Guid InventoryReservationId { get; private set; }

    public Guid InventoryBatchId { get; private set; }

    public Guid ProductVariantId { get; private set; }

    public string OwnerSessionId { get; private set; }

    public decimal Quantity { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public InventoryReservationStatus Status { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime? ReleasedAtUtc { get; private set; }

    public void Release(DateTime utcNow)
    {
        if (Status != InventoryReservationStatus.Active)
        {
            return;
        }

        Status = InventoryReservationStatus.Released;
        ReleasedAtUtc = utcNow;
    }
}
