namespace GroceryStore.Application.Features.Auth;

public sealed record ConfirmPhoneCommand(string UserId, string Code);
