using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public interface IPosRepository
{
    Task<IReadOnlyList<PosProductDto>> SearchProductsAsync(string query, CancellationToken cancellationToken);

    Task<IReadOnlyList<InventoryBatch>> GetActiveBatchesAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task<PosCheckoutProduct?> GetCheckoutProductAsync(Guid productVariantId, CancellationToken cancellationToken);

    Task AddOrderAsync(Order order, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);

    Task ExecuteInTransactionAsync(Func<Task> action, CancellationToken cancellationToken);
}

public sealed record PosProductDto(
    Guid ProductVariantId,
    string ProductName,
    string VariantName,
    string Sku,
    string Barcode,
    string UnitCode,
    decimal Price,
    decimal AvailableQuantity,
    bool IsWeighed);

public sealed record PosCheckoutProduct(decimal UnitPrice, bool IsWeighed);
