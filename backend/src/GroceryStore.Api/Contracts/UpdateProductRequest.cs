namespace GroceryStore.Api.Contracts;

public sealed record UpdateProductRequest(
    string Name,
    string Slug,
    string? Description,
    Guid CategoryId,
    Guid UnitOfMeasureId,
    bool IsActive);
