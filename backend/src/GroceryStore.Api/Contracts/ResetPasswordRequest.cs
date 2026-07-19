namespace GroceryStore.Api.Contracts;

public sealed record ResetPasswordRequest(string UserId, string Token, string NewPassword);
