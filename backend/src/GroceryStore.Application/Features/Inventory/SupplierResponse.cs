namespace GroceryStore.Application.Features.Inventory;

public sealed record SupplierResponse(Guid SupplierId, string Name, string? ContactName, string? PhoneNumber, string? Email, string? Address, bool IsActive);
