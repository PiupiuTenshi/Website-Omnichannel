namespace GroceryStore.Application.Features.Catalog;

public sealed record UpdateProductCommand(
    string Name,
    string Slug,
    string? Description,
    Guid CategoryId,
    Guid UnitOfMeasureId,
    bool IsActive);
