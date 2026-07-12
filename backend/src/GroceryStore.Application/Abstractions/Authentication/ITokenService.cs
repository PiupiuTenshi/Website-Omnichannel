using GroceryStore.Application.Features.Auth;

namespace GroceryStore.Application.Abstractions.Authentication;

public interface ITokenService
{
    AuthSessionResponse CreateSession(IdentityAccount account, IReadOnlyCollection<string> roles, string refreshToken, DateTime refreshTokenExpiresAtUtc);
}
