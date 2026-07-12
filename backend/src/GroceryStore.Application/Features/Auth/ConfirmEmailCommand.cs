namespace GroceryStore.Application.Features.Auth;

public sealed record ConfirmEmailCommand(string UserId, string Token);
