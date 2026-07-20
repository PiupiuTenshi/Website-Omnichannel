namespace GroceryStore.Api.Contracts;

public sealed record UpdateAccountProfileRequest(string? DisplayName, string? DefaultDeliveryAddress);
