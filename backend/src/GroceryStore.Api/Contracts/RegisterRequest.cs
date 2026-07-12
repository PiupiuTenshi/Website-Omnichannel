namespace GroceryStore.Api.Contracts;

public sealed record RegisterRequest(string? Email, string? PhoneNumber, string Password);
