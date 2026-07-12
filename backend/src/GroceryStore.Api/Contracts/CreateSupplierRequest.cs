namespace GroceryStore.Api.Contracts;

public sealed record CreateSupplierRequest(string Name, string? ContactName, string? PhoneNumber, string? Email, string? Address);
