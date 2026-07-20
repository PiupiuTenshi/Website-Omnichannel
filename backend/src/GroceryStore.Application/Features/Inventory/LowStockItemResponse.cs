namespace GroceryStore.Application.Features.Inventory;

public sealed record LowStockItemResponse(Guid ProductVariantId, string ProductName, string VariantName, string Sku, string UnitCode, decimal AvailableQuantity, decimal SuggestedPurchaseQuantity, decimal Revenue, Guid? SupplierId, string? SupplierName);
