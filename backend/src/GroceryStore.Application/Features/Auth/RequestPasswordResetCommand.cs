namespace GroceryStore.Application.Features.Auth;

public sealed record RequestPasswordResetCommand(string Identifier, string ResetUrl);
