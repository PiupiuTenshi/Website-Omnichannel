namespace GroceryStore.Application.Features.Inventory;

public sealed record UpdateSupplierCommand(string Name, string? ContactName, string? PhoneNumber, string? Email, string? Address, bool IsActive);
