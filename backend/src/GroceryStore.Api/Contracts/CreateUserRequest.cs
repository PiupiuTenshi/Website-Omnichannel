namespace GroceryStore.Api.Contracts;

public sealed record CreateUserRequest(string? Email, string? PhoneNumber, string Password, string Role);
