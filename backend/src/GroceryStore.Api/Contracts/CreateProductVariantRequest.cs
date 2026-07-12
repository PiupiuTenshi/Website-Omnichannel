namespace GroceryStore.Api.Contracts;

public sealed record CreateProductVariantRequest(
    string Name,
    string Sku,
    string? Barcode,
    decimal SellingPrice,
    decimal? CompareAtPrice,
    bool IsActive);
