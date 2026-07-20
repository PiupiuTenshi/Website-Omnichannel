namespace GroceryStore.Api.Contracts;

public sealed record UpdateSupplierRequest(
    string Name,
    string? ContactName,
    string? PhoneNumber,
    string? Email,
    string? Address,
    bool IsActive);
