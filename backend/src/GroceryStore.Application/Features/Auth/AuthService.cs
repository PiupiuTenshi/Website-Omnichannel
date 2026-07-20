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
            var code = GenerateOtpCode();
            var result = await identityAccountService.SaveEmailVerificationCodeAsync(account.UserId, code, DateTime.UtcNow.Add(OTP_EXPIRY), cancellationToken);
            if (!result.Succeeded)
            {
                throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
            }

            await emailSender.SendAsync(
                account.Email,
                "Verify your Tạp hóa chị Tỏ account",
                $"Your email verification code is: {code}",
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
            var activationResult = await identityAccountService.ActivateOnFirstSignInAsync(account.UserId, cancellationToken);
            if (!activationResult.Succeeded)
            {
                throw new BusinessRuleViolationException("The account is locked.");
            }

            account = await identityAccountService.FindByIdAsync(account.UserId, cancellationToken)
                ?? throw new UnauthorizedAccessException("The account no longer exists.");
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

    public Task<IReadOnlyCollection<UserAccountSummary>> GetAllUsersAsync(CancellationToken cancellationToken)
    {
        return identityAccountService.GetAllUsersAsync(cancellationToken);
    }

    public async Task<AccountProfileResponse> GetProfileAsync(string userId, CancellationToken cancellationToken)
    {
        var account = await identityAccountService.FindByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("The account was not found.");
        var roles = await identityAccountService.GetRolesAsync(userId, cancellationToken);
        return ToProfileResponse(account, roles);
    }

    public async Task<AccountProfileResponse> UpdateProfileAsync(
        string userId,
        UpdateAccountProfileCommand command,
        CancellationToken cancellationToken)
    {
        var result = await identityAccountService.UpdateProfileAsync(
            userId,
            command.DisplayName,
            command.DefaultDeliveryAddress,
            cancellationToken);
        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }

        return await GetProfileAsync(userId, cancellationToken);
    }

    public async Task ChangePasswordAsync(string userId, ChangePasswordCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.CurrentPassword))
        {
            throw new BusinessRuleViolationException("Current password is required.");
        }

        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 8)
        {
            throw new BusinessRuleViolationException("New password must contain at least eight characters.");
        }

        if (string.Equals(command.CurrentPassword, command.NewPassword, StringComparison.Ordinal))
        {
            throw new BusinessRuleViolationException("New password must be different from the current password.");
        }

        var result = await identityAccountService.ChangePasswordAsync(
            userId,
            command.CurrentPassword,
            command.NewPassword,
            cancellationToken);
        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }
    }

    public async Task RequestPasswordResetAsync(RequestPasswordResetCommand command, CancellationToken cancellationToken)
    {
        EmailAddress.TryNormalize(command.Identifier, out var normalizedEmail);
        PhoneNumber.TryNormalize(command.Identifier, out var normalizedPhoneNumber);
        var account = await identityAccountService.FindByLoginAsync(normalizedEmail, normalizedPhoneNumber, cancellationToken);
        if (account is null || string.IsNullOrWhiteSpace(command.ResetUrl) || !Uri.TryCreate(command.ResetUrl, UriKind.Absolute, out var resetUri))
        {
            return;
        }

        var token = await identityAccountService.GeneratePasswordResetTokenAsync(account.UserId, cancellationToken);
        if (string.IsNullOrWhiteSpace(token)) return;
        var separator = resetUri.Query.Length == 0 ? "?" : "&";
        var link = $"{resetUri}{separator}userId={Uri.EscapeDataString(account.UserId)}&token={Uri.EscapeDataString(token)}";
        if (account.EmailConfirmed && !string.IsNullOrWhiteSpace(account.Email))
        {
            await emailSender.SendAsync(account.Email, "Reset your password", $"Open this one-time link to reset your password: {link}", cancellationToken);
        }
        else if (account.PhoneNumberConfirmed && !string.IsNullOrWhiteSpace(account.PhoneNumber))
        {
            await smsOtpSender.SendAsync(account.PhoneNumber, link, cancellationToken);
        }
    }

    public async Task ResetPasswordAsync(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.NewPassword) || command.NewPassword.Length < 8)
            throw new BusinessRuleViolationException("New password must contain at least eight characters.");
        var result = await identityAccountService.ResetPasswordAsync(command.UserId, command.Token, command.NewPassword, cancellationToken);
        if (!result.Succeeded) throw new BusinessRuleViolationException("The password reset link is invalid or has expired.");
    }

    public async Task<ContactChangeRequestResponse> RequestContactChangeAsync(string userId, RequestContactChangeCommand command, CancellationToken cancellationToken)
    {
        var account = await identityAccountService.FindByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("The account was not found.");
        var newValue = command.NewValue?.Trim() ?? string.Empty;
        var normalizedNewValue = NormalizeContactChangeValue(command.Channel, newValue);
        var currentValue = command.Channel == ContactChangeChannel.Email ? account.Email : account.PhoneNumber;
        if (string.Equals(currentValue, newValue, StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessRuleViolationException("The new contact value must be different from the current value.");
        }

        var code = GenerateOtpCode();
        var result = await identityAccountService.SaveContactChangeRequestAsync(
            userId,
            command.Channel,
            newValue,
            normalizedNewValue,
            code,
            DateTime.UtcNow.Add(OTP_EXPIRY),
            cancellationToken);
        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }

        if (command.Channel == ContactChangeChannel.Email && account.EmailConfirmed && !string.IsNullOrWhiteSpace(account.Email))
        {
            await emailSender.SendAsync(account.Email, "Confirm contact change", $"Your confirmation code is: {code}", cancellationToken);
            return new ContactChangeRequestResponse(ContactChangeChannel.Email);
        }

        if (command.Channel == ContactChangeChannel.Phone && account.PhoneNumberConfirmed && !string.IsNullOrWhiteSpace(account.PhoneNumber))
        {
            await smsOtpSender.SendAsync(account.PhoneNumber, code, cancellationToken);
            return new ContactChangeRequestResponse(ContactChangeChannel.Phone);
        }

        if (account.EmailConfirmed && !string.IsNullOrWhiteSpace(account.Email))
        {
            await emailSender.SendAsync(account.Email, "Confirm contact change", $"Your confirmation code is: {code}", cancellationToken);
            return new ContactChangeRequestResponse(ContactChangeChannel.Email);
        }

        if (account.PhoneNumberConfirmed && !string.IsNullOrWhiteSpace(account.PhoneNumber))
        {
            await smsOtpSender.SendAsync(account.PhoneNumber, code, cancellationToken);
            return new ContactChangeRequestResponse(ContactChangeChannel.Phone);
        }

        throw new BusinessRuleViolationException("A verified current email address or phone number is required to change contact details.");
    }

    public async Task<AccountProfileResponse> ConfirmContactChangeAsync(string userId, ConfirmContactChangeCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.Code))
        {
            throw new BusinessRuleViolationException("A confirmation code is required.");
        }

        var result = await identityAccountService.ConfirmContactChangeAsync(userId, command.Channel, command.Code.Trim(), DateTime.UtcNow, cancellationToken);
        if (!result.Succeeded || result.NewValue is null)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }

        return await GetProfileAsync(userId, cancellationToken);
    }

    public async Task CreateUserWithRoleAsync(string? email, string? phoneNumber, string password, string role, CancellationToken cancellationToken)
    {
        RegistrationValidator.Validate(new RegisterUserCommand(email, phoneNumber, password));

        var result = await identityAccountService.CreateUserWithRoleAsync(email, phoneNumber, password, role, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }
    }

    public async Task ChangeUserRoleAsync(string userId, string newRole, CancellationToken cancellationToken)
    {
        var result = await identityAccountService.ChangeUserRoleAsync(userId, newRole, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
        }
    }

    public async Task DeleteUserAsync(string userId, CancellationToken cancellationToken)
    {
        var result = await identityAccountService.DeleteUserAsync(userId, cancellationToken);

        if (!result.Succeeded)
        {
            throw new BusinessRuleViolationException(string.Join(" ", result.Errors));
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

    private static AccountProfileResponse ToProfileResponse(IdentityAccount account, IReadOnlyCollection<string> roles) => new(
        account.UserId,
        account.Email,
        account.PhoneNumber,
        account.DisplayName,
        account.DefaultDeliveryAddress,
        roles);

    private static string NormalizeContactChangeValue(ContactChangeChannel channel, string value)
    {
        if (channel == ContactChangeChannel.Email)
        {
            if (!EmailAddress.TryNormalize(value, out var normalizedEmail) || string.IsNullOrWhiteSpace(normalizedEmail))
            {
                throw new BusinessRuleViolationException("A valid email address is required.");
            }

            return normalizedEmail;
        }

        if (!PhoneNumber.TryNormalize(value, out var normalizedPhoneNumber) || string.IsNullOrWhiteSpace(normalizedPhoneNumber))
        {
            throw new BusinessRuleViolationException("A valid phone number is required.");
        }

        return normalizedPhoneNumber;
    }
}
