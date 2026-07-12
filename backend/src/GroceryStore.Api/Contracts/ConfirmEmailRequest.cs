namespace GroceryStore.Api.Contracts;

public sealed record ConfirmEmailRequest(string UserId, string Token);
