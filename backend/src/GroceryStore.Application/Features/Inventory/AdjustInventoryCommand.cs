namespace GroceryStore.Application.Features.Inventory;

public sealed record AdjustInventoryCommand(decimal QuantityDelta, string Reason);
