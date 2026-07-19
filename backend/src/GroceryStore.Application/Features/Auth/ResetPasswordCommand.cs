namespace GroceryStore.Application.Features.Auth;

public sealed record ResetPasswordCommand(string UserId, string Token, string NewPassword);
