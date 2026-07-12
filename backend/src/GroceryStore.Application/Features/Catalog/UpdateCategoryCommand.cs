namespace GroceryStore.Application.Features.Catalog;

public sealed record UpdateCategoryCommand(string Name, string Slug, Guid? ParentCategoryId, int SortOrder, bool IsActive);
