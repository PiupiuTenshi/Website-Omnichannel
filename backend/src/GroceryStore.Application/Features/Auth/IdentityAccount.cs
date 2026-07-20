namespace GroceryStore.Application.Features.Auth;

public sealed record IdentityAccount(
    string UserId,
    string? Email,
    string? NormalizedEmail,
    string? PhoneNumber,
    string? NormalizedPhoneNumber,
    string? DisplayName,
    string? DefaultDeliveryAddress,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    bool IsActive,
    bool RequiresInitialActivation);
