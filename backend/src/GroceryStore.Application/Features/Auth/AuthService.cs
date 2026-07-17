using System.Security.Cryptography;
using System.Text;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Abstractions.Email;
using GroceryStore.Application.Abstractions.Sms;
using GroceryStore.Application.Exceptions;
using GroceryStore.Domain.Entities;
using GroceryStore.Domain.Rules;
using GroceryStore.Domain.ValueObjects;

namespace GroceryStore.Application.Features.Auth;

public sealed class AuthService
{
    private const int OTP_LENGTH = 6;
    private static readonly TimeSpan OTP_EXPIRY = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan REFRESH_TOKEN_EXPIRY = TimeSpan.FromDays(7);

    private readonly IIdentityAccountService identityAccountService;
    private readonly IRefreshSessionStore refreshSessionStore;
    private readonly ITokenService tokenService;
    private readonly IEmailSender emailSender;
    private readonly ISmsOtpSender smsOtpSender;

    public AuthService(
        IIdentityAccountService identityAccountService,
        IRefreshSessionStore refreshSessionStore,
        ITokenService tokenService,
        IEmailSender emailSender,
        ISmsOtpSender smsOtpSender)
    {
        this.identityAccountService = identityAccountService;
        this.refreshSessionStore = refreshSessionStore;
        this.tokenService = tokenService;
        this.emailSender = emailSender;
        this.smsOtpSender = smsOtpSender;
    }

    public async Task<RegistrationResponse> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var contacts = RegistrationValidator.Validate(command);
        var createResult = await identityAccountService.CreateBuyerAsync(
            command,
            contacts.NormalizedEmail,
            contacts.NormalizedPhoneNumber,
            cancellationToken);

        if (!createResult.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", createResult.Errors));
        }

        var account = await identityAccountService.FindByLoginAsync(
                contacts.NormalizedEmail,
                contacts.NormalizedPhoneNumber,
                cancellationToken)
            ?? throw new InvalidOperationException("The new account could not be loaded.");

        if (account.Email is not null)
        {
            var token = await identityAccountService.GenerateEmailConfirmationTokenAsync(account.UserId, cancellationToken)
                ?? throw new InvalidOperationException("The email confirmation token could not be generated.");

            await emailSender.SendAsync(
                account.Email,
                "Verify your Tạp hóa chị Tỏ account",
                $"Your email verification token is: {token}",
                cancellationToken);
        }

        if (account.PhoneNumber is not null)
        {
            var code = GenerateOtpCode();
            var result = await identityAccountService.SavePhoneVerificationCodeAsync(
                account.UserId,
                code,
                DateTime.UtcNow.Add(OTP_EXPIRY),
                cancellationToken);

            if (!result.Succeeded)
            {
                throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
            }

            await smsOtpSender.SendAsync(account.PhoneNumber, code, cancellationToken);
        }

        return new RegistrationResponse(account.UserId, account.Email is not null, account.PhoneNumber is not null);
    }

    public async Task<AuthSessionResponse> LoginAsync(LoginCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Identifier) || string.IsNullOrWhiteSpace(command.Password))
        {
            throw new BusinessRuleViolationException("Email or phone number and password are required.");
        }

        EmailAddress.TryNormalize(command.Identifier, out var normalizedEmail);
        PhoneNumber.TryNormalize(command.Identifier, out var normalizedPhoneNumber);

        var account = await identityAccountService.FindByLoginAsync(normalizedEmail, normalizedPhoneNumber, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid sign-in information.");

        if (!await identityAccountService.CheckPasswordAsync(account.UserId, command.Password, cancellationToken))
        {
            throw new UnauthorizedAccessException("Invalid sign-in information.");
        }

        if (!account.IsActive)
        {
            throw new BusinessRuleViolationException("The account is locked.");
        }

        if (!AccountVerificationPolicy.IsVerified(account.EmailConfirmed, account.PhoneNumberConfirmed))
        {
            throw new BusinessRuleViolationException("The account has not been verified.");
        }

        return await CreateSessionAsync(account, cancellationToken);
    }

    public async Task<AuthSessionResponse> RefreshAsync(RefreshSessionCommand command, CancellationToken cancellationToken)
    {
        var tokenHash = HashToken(command.RefreshToken);
        var refreshSession = await refreshSessionStore.FindByTokenHashAsync(tokenHash, cancellationToken);

        if (refreshSession is null || !refreshSession.IsActive(DateTime.UtcNow))
        {
            throw new UnauthorizedAccessException("The refresh token is invalid or expired.");
        }

        var account = await identityAccountService.FindByIdAsync(refreshSession.UserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("The account no longer exists.");

        if (!account.IsActive || !AccountVerificationPolicy.IsVerified(account.EmailConfirmed, account.PhoneNumberConfirmed))
        {
            throw new UnauthorizedAccessException("The account cannot create a new session.");
        }

        refreshSession.Revoke(DateTime.UtcNow);
        await refreshSessionStore.SaveChangesAsync(cancellationToken);

        return await CreateSessionAsync(account, cancellationToken);
    }

    public async Task LogoutAsync(RefreshSessionCommand command, CancellationToken cancellationToken)
    {
        var refreshSession = await refreshSessionStore.FindByTokenHashAsync(HashToken(command.RefreshToken), cancellationToken);

        if (refreshSession is null || !refreshSession.IsActive(DateTime.UtcNow))
        {
            return;
        }

        refreshSession.Revoke(DateTime.UtcNow);
        await refreshSessionStore.SaveChangesAsync(cancellationToken);
    }

    public async Task ConfirmEmailAsync(ConfirmEmailCommand command, CancellationToken cancellationToken)
    {
        var result = await identityAccountService.ConfirmEmailAsync(command, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }
    }

    public async Task ConfirmPhoneAsync(ConfirmPhoneCommand command, CancellationToken cancellationToken)
    {
        var result = await identityAccountService.ConfirmPhoneAsync(command, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }
    }

    public async Task SetUserActiveAsync(string userId, bool isActive, CancellationToken cancellationToken)
    {
        var result = await identityAccountService.SetUserActiveAsync(userId, isActive, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }

        if (!isActive)
        {
            var revokedSessionCount = await refreshSessionStore.RevokeActiveForUserAsync(userId, DateTime.UtcNow, cancellationToken);
            if (revokedSessionCount > 0)
            {
                await refreshSessionStore.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private async Task<AuthSessionResponse> CreateSessionAsync(IdentityAccount account, CancellationToken cancellationToken)
    {
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var refreshTokenExpiresAtUtc = DateTime.UtcNow.Add(REFRESH_TOKEN_EXPIRY);
        await refreshSessionStore.AddAsync(
            new RefreshSession(account.UserId, HashToken(refreshToken), refreshTokenExpiresAtUtc),
            cancellationToken);
        await refreshSessionStore.SaveChangesAsync(cancellationToken);

        var roles = await identityAccountService.GetRolesAsync(account.UserId, cancellationToken);
        return tokenService.CreateSession(account, roles, refreshToken, refreshTokenExpiresAtUtc);
    }

    private static string GenerateOtpCode()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000).ToString($"D{OTP_LENGTH}");
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }
}
