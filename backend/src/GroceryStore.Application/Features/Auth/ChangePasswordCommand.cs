namespace GroceryStore.Application.Features.Auth;

public sealed record ChangePasswordCommand(string CurrentPassword, string NewPassword);
