namespace GroceryStore.Api.Contracts;

public sealed record ErrorResponse(string Title, int Status, string TraceId);
