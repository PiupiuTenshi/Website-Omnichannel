namespace GroceryStore.Api.Contracts;

public sealed record LinkProductSupplierRequest(Guid ProductId, Guid SupplierId, string? SupplierProductCode, bool IsPreferred);
