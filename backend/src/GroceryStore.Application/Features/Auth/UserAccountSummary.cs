namespace GroceryStore.Application.Features.Auth;

public sealed record UserAccountSummary(
    string UserId,
    string? Email,
    string? PhoneNumber,
    bool EmailConfirmed,
    bool PhoneNumberConfirmed,
    bool IsActive,
    bool RequiresInitialActivation,
    IReadOnlyCollection<string> Roles);
