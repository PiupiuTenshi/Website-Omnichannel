namespace GroceryStore.Api.Contracts;

public sealed record CreateUserRequest(string Email, string Password, string Role);
