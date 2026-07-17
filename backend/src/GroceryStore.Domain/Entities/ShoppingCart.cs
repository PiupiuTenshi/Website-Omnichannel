namespace GroceryStore.Domain.Entities;

public sealed class ShoppingCart
{
    private readonly List<ShoppingCartItem> items = [];

    private ShoppingCart()
    {
        SessionId = null;
        UserId = null;
    }

    private ShoppingCart(string? sessionId, string? userId, DateTime createdAtUtc)
    {
        if (string.IsNullOrWhiteSpace(sessionId) == string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("A cart must belong to exactly one guest session or user.");
        }

        ShoppingCartId = Guid.NewGuid();
        SessionId = sessionId;
        UserId = userId;
        CreatedAtUtc = createdAtUtc;
        UpdatedAtUtc = createdAtUtc;
    }

    public Guid ShoppingCartId { get; private set; }

    public string? SessionId { get; private set; }

    public string? UserId { get; private set; }

    public bool IsMerged { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public byte[] RowVersion { get; private set; } = Array.Empty<byte>();

    public IReadOnlyCollection<ShoppingCartItem> Items => items.AsReadOnly();

    public static ShoppingCart CreateGuest(string sessionId, DateTime utcNow) => new(sessionId, null, utcNow);

    public static ShoppingCart CreateForUser(string userId, DateTime utcNow) => new(null, userId, utcNow);

    public void SetItemQuantity(Guid productVariantId, decimal quantity, DateTime utcNow)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Cart item quantity must be positive.");
        }

        var existingItem = items.SingleOrDefault(item => item.ProductVariantId == productVariantId);
        if (existingItem is null)
        {
            items.Add(new ShoppingCartItem(ShoppingCartId, productVariantId, quantity, utcNow));
        }
        else
        {
            existingItem.SetQuantity(quantity, utcNow);
        }

        UpdatedAtUtc = utcNow;
    }

    public void RemoveItem(Guid productVariantId, DateTime utcNow)
    {
        var existingItem = items.SingleOrDefault(item => item.ProductVariantId == productVariantId);
        if (existingItem is not null)
        {
            items.Remove(existingItem);
            UpdatedAtUtc = utcNow;
        }
    }

    public void Clear(DateTime utcNow)
    {
        items.Clear();
        UpdatedAtUtc = utcNow;
    }

    public void MergeFrom(ShoppingCart guestCart, DateTime utcNow)
    {
        foreach (var guestItem in guestCart.Items)
        {
            var existingItem = items.SingleOrDefault(item => item.ProductVariantId == guestItem.ProductVariantId);
            if (existingItem is null)
            {
                items.Add(new ShoppingCartItem(ShoppingCartId, guestItem.ProductVariantId, guestItem.Quantity, utcNow));
            }
            else
            {
                existingItem.SetQuantity(existingItem.Quantity + guestItem.Quantity, utcNow);
            }
        }

        guestCart.MarkMerged(utcNow);
        UpdatedAtUtc = utcNow;
    }

    private void MarkMerged(DateTime utcNow)
    {
        IsMerged = true;
        UpdatedAtUtc = utcNow;
    }
}
