namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductDetailResponse(
    Guid ProductId,
    string Name,
    string Slug,
    string? Description,
    Guid CategoryId,
    string CategoryName,
    Guid UnitOfMeasureId,
    string UnitName,
    bool AllowsDecimal,
    int DecimalScale,
    bool IsActive,
    IReadOnlyList<ProductVariantResponse> Variants,
    IReadOnlyList<ProductImageResponse> Images);
