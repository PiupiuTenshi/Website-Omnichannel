namespace GroceryStore.Application.Features.Auth;

public sealed record AccountProfileResponse(
    string UserId,
    string? Email,
    string? PhoneNumber,
    string? DisplayName,
    string? DefaultDeliveryAddress,
    IReadOnlyCollection<string> Roles);
