using GroceryStore.Domain.Enums;

namespace GroceryStore.Application.Abstractions.Persistence;

public sealed record DetailedInventoryBatch(
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
    string ProductName,
    string VariantName,
    string Sku,
    string UnitCode,
    string SupplierName,
    decimal SellingPrice,
    decimal? CompareAtPrice);
