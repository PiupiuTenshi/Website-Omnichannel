namespace GroceryStore.Application.Features.Catalog;

public sealed record ProductListItemResponse(
    Guid ProductId,
    string Name,
    string Slug,
    string CategoryName,
    string UnitName,
    decimal SellingPrice,
    decimal? CompareAtPrice,
    string? PrimaryImageUrl);
