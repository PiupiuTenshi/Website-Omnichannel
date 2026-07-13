using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IShoppingCartRepository
{
    Task<ShoppingCart?> GetGuestCartAsync(string sessionId, CancellationToken cancellationToken);

    Task<ShoppingCart?> GetUserCartAsync(string userId, CancellationToken cancellationToken);

    Task<CartProduct?> GetActiveProductAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task<IReadOnlyList<CartItemSnapshot>> GetSnapshotAsync(ShoppingCart cart, CancellationToken cancellationToken);

    Task AddAsync(ShoppingCart cart, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed record CartProduct(string Name, string VariantName, decimal UnitPrice, bool IsWeighed);

public sealed record CartItemSnapshot(Guid ProductVariantId, string Name, string VariantName, decimal Quantity, decimal UnitPrice, bool IsWeighed);
