namespace GroceryStore.Application.Features.Catalog;

public sealed record UpdateProductVariantCommand(
    string Name,
    string Sku,
    string? Barcode,
    decimal SellingPrice,
    decimal? CompareAtPrice,
    bool IsActive);
