namespace GroceryStore.Api.Contracts;

public sealed record UpdateUnitOfMeasureRequest(string Code, string Name, bool AllowsDecimal, int DecimalScale, bool IsActive);
