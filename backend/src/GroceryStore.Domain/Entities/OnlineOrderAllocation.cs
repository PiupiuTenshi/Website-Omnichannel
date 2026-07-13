namespace GroceryStore.Domain.Entities;

public sealed class OnlineOrderAllocation
{
    private OnlineOrderAllocation() { }
    public OnlineOrderAllocation(Guid onlineOrderId, Guid onlineOrderItemId, Guid inventoryBatchId, decimal quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        OnlineOrderAllocationId = Guid.NewGuid(); OnlineOrderId = onlineOrderId; OnlineOrderItemId = onlineOrderItemId; InventoryBatchId = inventoryBatchId; Quantity = quantity;
    }
    public Guid OnlineOrderAllocationId { get; private set; }
    public Guid OnlineOrderId { get; private set; }
    public Guid OnlineOrderItemId { get; private set; }
    public Guid InventoryBatchId { get; private set; }
    public decimal Quantity { get; private set; }
}
