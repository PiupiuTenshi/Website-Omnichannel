namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductListItemResponse(
    Guid ProductId,
    Guid ProductVariantId,
    string Name,
    string Slug,
    string CategoryName,
    string UnitName,
    decimal SellingPrice,
    decimal? CompareAtPrice,
    string? PrimaryImageUrl,
    bool IsWeighed,
    DateTime? PromotionStartAtUtc,
    DateTime? PromotionEndAtUtc);
