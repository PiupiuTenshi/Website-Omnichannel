using GroceryStore.Domain.Enums;

namespace GroceryStore.Application.Features.Inventory;

public sealed record InventoryBatchResponse(
    Guid InventoryBatchId,
    Guid ProductVariantId,
    Guid? SupplierId,
    decimal InitialQuantity,
    decimal AvailableQuantity,
    decimal UnitCost,
    DateTime ReceivedAtUtc,
    DateTime? ManufacturedAtUtc,
    DateTime? ExpiresAtUtc,
    InventoryBatchStatus Status,
    string ProductName = "",
    string VariantName = "",
    string Sku = "",
    string UnitCode = "",
    string SupplierName = "",
    decimal SellingPrice = 0,
    decimal? CompareAtPrice = null);
