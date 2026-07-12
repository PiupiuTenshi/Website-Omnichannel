namespace GroceryStore.Application.Features.StoreSettings;

public sealed record StoreSettingsResponse(
    string Name,
    string? Email,
    string Address,
    bool IsOnlineOrderingEnabled,
    IReadOnlyCollection<string> ContactNumbers,
    string RowVersion);
