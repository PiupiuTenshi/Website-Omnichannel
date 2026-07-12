using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Features.Auth;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GroceryStore.Infrastructure.Authentication;

public sealed class JwtTokenService : ITokenService
{
    private readonly JwtOptions options;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        this.options = options.Value;
    }

    public AuthSessionResponse CreateSession(
        IdentityAccount account,
        IReadOnlyCollection<string> roles,
        string refreshToken,
        DateTime refreshTokenExpiresAtUtc)
    {
        if (string.IsNullOrWhiteSpace(options.Key) || options.Key.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Key must be configured with at least 32 characters.");
        }

        if (string.IsNullOrWhiteSpace(options.Issuer) || string.IsNullOrWhiteSpace(options.Audience))
        {
            throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be configured.");
        }

        var accessTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(options.AccessTokenLifetimeMinutes);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, account.UserId)
        };

        if (account.Email is not null)
        {
            claims.Add(new Claim(ClaimTypes.Email, account.Email));
        }

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            options.Issuer,
            options.Audience,
            claims,
            expires: accessTokenExpiresAtUtc,
            signingCredentials: credentials);

        return new AuthSessionResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            accessTokenExpiresAtUtc,
            refreshToken,
            refreshTokenExpiresAtUtc);
    }
}
