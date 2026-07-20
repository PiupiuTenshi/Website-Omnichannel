using System;

namespace GroceryStore.Application.Features.Inventory;

public sealed record VariantStatsResponse(Guid ProductVariantId, decimal AvailableQuantity, decimal Revenue, Guid? SupplierId, string? SupplierName);
