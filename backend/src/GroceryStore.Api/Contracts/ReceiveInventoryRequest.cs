namespace GroceryStore.Api.Contracts;

public sealed record ReceiveInventoryRequest(Guid ProductVariantId, Guid? SupplierId, decimal Quantity, decimal UnitCost, DateTime ReceivedAtUtc, DateTime? ManufacturedAtUtc, DateTime? ExpiresAtUtc, string? Reference);
