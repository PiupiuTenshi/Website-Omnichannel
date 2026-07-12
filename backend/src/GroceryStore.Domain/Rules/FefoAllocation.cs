namespace GroceryStore.Domain.Rules;

public sealed record FefoAllocation(Guid InventoryBatchId, decimal Quantity);
