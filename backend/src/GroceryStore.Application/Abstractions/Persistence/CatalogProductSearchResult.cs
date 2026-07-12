using GroceryStore.Domain.Entities;

namespace GroceryStore.Application.Abstractions.Persistence;

public sealed record CatalogProductSearchResult(IReadOnlyList<Product> Products, int TotalCount);
