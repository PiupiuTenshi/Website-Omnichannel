namespace GroceryStore.Application.Abstractions.Persistence;

public sealed record LowStockInventoryItem(Guid ProductVariantId, string ProductName, string VariantName, string Sku, string UnitCode, decimal AvailableQuantity, decimal Revenue, Guid? SupplierId, string? SupplierName);
