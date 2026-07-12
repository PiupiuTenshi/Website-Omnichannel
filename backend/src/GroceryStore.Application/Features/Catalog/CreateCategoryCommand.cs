namespace GroceryStore.Application.Features.Catalog;

public sealed record CreateCategoryCommand(string Name, string Slug, Guid? ParentCategoryId, int SortOrder, bool IsActive);
