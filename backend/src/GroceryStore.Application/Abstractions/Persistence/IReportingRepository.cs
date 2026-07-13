namespace GroceryStore.Application.Abstractions.Persistence;

public interface IReportingRepository
{
    Task<IReadOnlyList<RevenueReportRow>> GetRevenueAsync(DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProductSalesReportRow>> GetProductSalesAsync(DateTime fromUtc, DateTime toUtc, bool ascending, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryAlertReportRow>> GetLowStockAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryAlertReportRow>> GetExpiringSoonAsync(DateTime utcNow, CancellationToken cancellationToken);
}

public sealed record RevenueReportRow(DateOnly Date, decimal Revenue);
public sealed record ProductSalesReportRow(Guid ProductVariantId, string ProductName, string VariantName, decimal QuantitySold, decimal Revenue);
public sealed record InventoryAlertReportRow(Guid ProductVariantId, string ProductName, string VariantName, decimal AvailableQuantity, DateTime? ExpiresAtUtc);
