namespace GroceryStore.Api.Contracts;

public sealed record UpdateStoreSettingsRequest(
    string Name,
    string? Email,
    string Address,
    bool IsOnlineOrderingEnabled,
    IReadOnlyCollection<string> ContactNumbers,
    string RowVersion);
