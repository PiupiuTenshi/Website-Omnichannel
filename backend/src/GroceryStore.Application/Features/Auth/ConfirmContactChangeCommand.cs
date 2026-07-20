namespace GroceryStore.Application.Features.Auth;

public sealed record ConfirmContactChangeCommand(ContactChangeChannel Channel, string Code);
