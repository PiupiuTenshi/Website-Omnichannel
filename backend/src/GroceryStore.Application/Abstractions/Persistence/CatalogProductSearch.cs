namespace GroceryStore.Application.Abstractions.Persistence;

public sealed record CatalogProductSearch(
    string? SearchTerm,
    Guid? CategoryId,
    int Page,
    int PageSize,
    bool IncludeInactive);
