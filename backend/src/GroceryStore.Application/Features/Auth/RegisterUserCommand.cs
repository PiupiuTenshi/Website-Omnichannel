namespace GroceryStore.Application.Features.Auth;

public sealed record RegisterUserCommand(string? Email, string? PhoneNumber, string Password);
