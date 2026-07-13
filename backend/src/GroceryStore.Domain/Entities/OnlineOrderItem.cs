namespace GroceryStore.Domain.Entities;

public sealed class OnlineOrderItem
{
    private OnlineOrderItem() { }
    public OnlineOrderItem(Guid onlineOrderId, Guid productVariantId, decimal quantity, decimal unitPrice)
    {
        if (quantity <= 0 || unitPrice < 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        OnlineOrderItemId = Guid.NewGuid(); OnlineOrderId = onlineOrderId; ProductVariantId = productVariantId; Quantity = quantity; UnitPrice = unitPrice; LineTotal = quantity * unitPrice;
    }
    public Guid OnlineOrderItemId { get; private set; }
    public Guid OnlineOrderId { get; private set; }
    public Guid ProductVariantId { get; private set; }
    public decimal Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal LineTotal { get; private set; }
}
