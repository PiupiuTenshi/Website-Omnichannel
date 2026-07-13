namespace GroceryStore.Domain.Entities;

public sealed class ShoppingCartItem
{
    private ShoppingCartItem()
    {
    }

    public ShoppingCartItem(Guid shoppingCartId, Guid productVariantId, decimal quantity, DateTime createdAtUtc)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Cart item quantity must be positive.");
        }

        ShoppingCartItemId = Guid.NewGuid();
        ShoppingCartId = shoppingCartId;
        ProductVariantId = productVariantId;
        Quantity = quantity;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid ShoppingCartItemId { get; private set; }

    public Guid ShoppingCartId { get; private set; }

    public Guid ProductVariantId { get; private set; }

    public decimal Quantity { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public void SetQuantity(decimal quantity, DateTime utcNow)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Cart item quantity must be positive.");
        }

        Quantity = quantity;
        UpdatedAtUtc = utcNow;
    }
}
