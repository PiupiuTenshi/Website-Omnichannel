namespace GroceryStore.Application.Features.Catalog;

public sealed record CreateProductCommand(
    string Name,
    string Slug,
    string? Description,
    Guid CategoryId,
    Guid UnitOfMeasureId,
    bool IsActive,
    IReadOnlyList<CreateProductVariantCommand> Variants);
