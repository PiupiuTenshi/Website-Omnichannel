namespace GroceryStore.Application.Features.Catalog;

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
