namespace GroceryStore.Application.Features.StoreSettings;

public sealed record UpdateStoreSettingsCommand(
    string Name,
    string? Email,
    string Address,
    bool IsOnlineOrderingEnabled,
    IReadOnlyCollection<string> ContactNumbers,
    string RowVersion);
