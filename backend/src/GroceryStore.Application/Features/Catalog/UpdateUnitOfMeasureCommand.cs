namespace GroceryStore.Application.Features.Catalog;

public sealed record UpdateUnitOfMeasureCommand(string Code, string Name, bool AllowsDecimal, int DecimalScale, bool IsActive);
