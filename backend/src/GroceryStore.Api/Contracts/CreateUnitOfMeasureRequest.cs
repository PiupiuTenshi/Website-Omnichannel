namespace GroceryStore.Api.Contracts;

public sealed record CreateUnitOfMeasureRequest(string Code, string Name, bool AllowsDecimal, int DecimalScale, bool IsActive);
