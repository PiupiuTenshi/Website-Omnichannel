namespace GroceryStore.Domain.Enums;

public enum InventoryTransactionType
{
    Receipt,
    AdjustmentIncrease,
    AdjustmentDecrease,
    Allocation,
    ExpiryWriteOff,
    ReservationHold,
    ReservationRelease,
    OnlineOrderCancellationRelease
}
