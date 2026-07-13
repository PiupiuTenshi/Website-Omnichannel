namespace GroceryStore.Application.Features.Inventory;

public sealed record ReceiveInventoryCommand(Guid ProductVariantId, Guid? SupplierId, decimal Quantity, decimal UnitCost, DateTime ReceivedAtUtc, DateTime? ManufacturedAtUtc, DateTime? ExpiresAtUtc, string? Reference);
