namespace GroceryStore.Application.Features.Auth;

public sealed record RegistrationResponse(string UserId, bool RequiresEmailVerification, bool RequiresPhoneVerification);
