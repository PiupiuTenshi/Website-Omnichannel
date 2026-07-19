namespace GroceryStore.Api.Contracts;

public sealed record RequestPasswordResetRequest(string Identifier, string ResetUrl);
