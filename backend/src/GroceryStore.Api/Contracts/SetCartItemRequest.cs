namespace GroceryStore.Api.Contracts;

public sealed record SetCartItemRequest(Guid ProductVariantId, decimal Quantity);
