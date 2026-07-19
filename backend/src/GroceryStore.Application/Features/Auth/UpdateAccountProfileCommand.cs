namespace GroceryStore.Application.Features.Auth;

public sealed record UpdateAccountProfileCommand(string? DisplayName, string? DefaultDeliveryAddress);
