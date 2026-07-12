namespace GroceryStore.Api.Contracts;

public sealed record CreateCategoryRequest(string Name, string Slug, Guid? ParentCategoryId, int SortOrder, bool IsActive);
