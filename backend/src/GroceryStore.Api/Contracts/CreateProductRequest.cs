namespace GroceryStore.Api.Contracts;

public sealed record CreateProductRequest(
    string Name,
    string Slug,
    string? Description,
    Guid CategoryId,
    Guid UnitOfMeasureId,
    bool IsActive,
    IReadOnlyList<CreateProductVariantRequest> Variants);
