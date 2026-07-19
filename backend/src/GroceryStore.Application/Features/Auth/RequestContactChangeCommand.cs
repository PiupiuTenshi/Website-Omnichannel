namespace GroceryStore.Application.Features.Auth;

public sealed record RequestContactChangeCommand(ContactChangeChannel Channel, string NewValue);
