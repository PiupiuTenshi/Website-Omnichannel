using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Abstractions.Email;
using GroceryStore.Application.Abstractions.Sms;
using GroceryStore.Application.Exceptions;
using GroceryStore.Application.Features.Auth;
using GroceryStore.Domain.Entities;

namespace GroceryStore.UnitTests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_RejectsAnUnverifiedAccount()
    {
        var service = new AuthService(
            new UnverifiedAccountService(),
            new UnusedRefreshSessionStore(),
            new UnusedTokenService(),
            new UnusedEmailSender(),
            new UnusedSmsOtpSender());

        var exception = await Assert.ThrowsAsync<BusinessRuleViolationException>(
            () => service.LoginAsync(new LoginCommand("buyer@example.com", "password1"), CancellationToken.None));

        Assert.Contains("not been verified", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class UnverifiedAccountService : IIdentityAccountService
    {
        private static readonly IdentityAccount ACCOUNT = new(
            "user-id",
            "buyer@example.com",
            "BUYER@EXAMPLE.COM",
            null,
            null,
            false,
            false,
            true);

        public Task<IdentityOperationResult> CreateBuyerAsync(RegisterUserCommand command, string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityAccount?> FindByLoginAsync(string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken)
        {
            return Task.FromResult<IdentityAccount?>(ACCOUNT);
        }

        public Task<IdentityAccount?> FindByIdAsync(string userId, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken cancellationToken)
        {
            return Task.FromResult(true);
        }

        public Task<IReadOnlyCollection<string>> GetRolesAsync(string userId, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<string?> GenerateEmailConfirmationTokenAsync(string userId, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> ConfirmEmailAsync(ConfirmEmailCommand command, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> SavePhoneVerificationCodeAsync(string userId, string code, DateTime expiresAtUtc, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> ConfirmPhoneAsync(ConfirmPhoneCommand command, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> SetUserActiveAsync(string userId, bool isActive, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<int> CountActiveAdminsAsync(CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IReadOnlyCollection<UserAccountSummary>> GetAllUsersAsync(CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> CreateUserWithRoleAsync(string email, string password, string role, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> ChangeUserRoleAsync(string userId, string newRole, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }

        public Task<IdentityOperationResult> DeleteUserAsync(string userId, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }
    }

    private sealed class UnusedRefreshSessionStore : IRefreshSessionStore
    {
        public Task AddAsync(RefreshSession refreshSession, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<RefreshSession?> FindByTokenHashAsync(string tokenHash, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class UnusedTokenService : ITokenService
    {
        public AuthSessionResponse CreateSession(IdentityAccount account, IReadOnlyCollection<string> roles, string refreshToken, DateTime refreshTokenExpiresAtUtc)
        {
            throw new NotSupportedException();
        }
    }

    private sealed class UnusedEmailSender : IEmailSender
    {
        public Task SendAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken) => throw new NotSupportedException();
    }

    private sealed class UnusedSmsOtpSender : ISmsOtpSender
    {
        public Task SendAsync(string phoneNumber, string code, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
