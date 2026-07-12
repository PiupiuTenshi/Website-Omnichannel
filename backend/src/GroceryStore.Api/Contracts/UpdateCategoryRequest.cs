namespace GroceryStore.Api.Contracts;

public sealed record UpdateCategoryRequest(string Name, string Slug, Guid? ParentCategoryId, int SortOrder, bool IsActive);
