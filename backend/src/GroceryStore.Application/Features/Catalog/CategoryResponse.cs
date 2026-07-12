namespace GroceryStore.Application.Features.Catalog;

public sealed record CategoryResponse(Guid CategoryId, string Name, string Slug, Guid? ParentCategoryId, int SortOrder, bool IsActive);
