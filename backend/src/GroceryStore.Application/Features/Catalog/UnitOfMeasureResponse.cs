namespace GroceryStore.Application.Features.Catalog;

public sealed record UnitOfMeasureResponse(Guid UnitOfMeasureId, string Code, string Name, bool AllowsDecimal, int DecimalScale, bool IsActive);
