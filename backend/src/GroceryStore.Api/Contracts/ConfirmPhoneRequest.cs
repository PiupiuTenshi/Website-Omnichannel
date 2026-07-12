namespace GroceryStore.Api.Contracts;

public sealed record ConfirmPhoneRequest(string UserId, string Code);
