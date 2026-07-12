namespace GroceryStore.Api.Contracts;

public sealed record AdjustInventoryRequest(decimal QuantityDelta, string Reason);
