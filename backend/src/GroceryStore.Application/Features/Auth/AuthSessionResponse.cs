namespace GroceryStore.Application.Features.Auth;

public sealed record AuthSessionResponse(string AccessToken, DateTime AccessTokenExpiresAtUtc, string RefreshToken, DateTime RefreshTokenExpiresAtUtc);
