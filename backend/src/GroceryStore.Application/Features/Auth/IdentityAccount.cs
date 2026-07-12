namespace GroceryStore.Application.Features.Auth;

public sealed record IdentityAccount(
    string UserId,
    string? Email,
    string? NormalizedEmail,
    string? PhoneNumber,
    string? NormalizedPhoneNumber,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    bool IsActive);
