namespace GroceryStore.Application.Features.Inventory;

public sealed record CreateSupplierCommand(string Name, string? ContactName, string? PhoneNumber, string? Email, string? Address);
