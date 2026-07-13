namespace GroceryStore.Application.Features.Inventory;

public sealed record LinkProductSupplierCommand(Guid ProductId, Guid SupplierId, string? SupplierProductCode, bool IsPreferred);
