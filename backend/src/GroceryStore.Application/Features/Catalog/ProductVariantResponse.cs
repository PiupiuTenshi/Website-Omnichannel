namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductVariantResponse(
    Guid ProductVariantId,
    string Name,
    string Sku,
    string? Barcode,
    decimal SellingPrice,
    decimal? CompareAtPrice,
    bool IsActive,
    string RowVersion);
