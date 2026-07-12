using System.Security.Cryptography;
using System.Text;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Features.Auth;
using GroceryStore.Domain.Enums;
using GroceryStore.Domain.Rules;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Authentication;

public sealed class IdentityAccountService : IIdentityAccountService
{
    private const string PHONE_OTP_LOGIN_PROVIDER = "PhoneOtp";
    private const string PHONE_OTP_TOKEN_NAME = "VerificationCode";

    private readonly UserManager<ApplicationUser> userManager;
    private readonly ApplicationDbContext applicationDbContext;

    public IdentityAccountService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext applicationDbContext)
    {
        this.userManager = userManager;
        this.applicationDbContext = applicationDbContext;
    }

    public async Task<IdentityOperationResult> CreateBuyerAsync(
        RegisterUserCommand command,
        string? normalizedEmail,
        string? normalizedPhoneNumber,
        CancellationToken cancellationToken)
    {
        if (await ContactAlreadyExistsAsync(normalizedEmail, normalizedPhoneNumber, cancellationToken))
        {
            return Failure("An account already uses this email address or phone number.");
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail ?? normalizedPhoneNumber,
            Email = command.Email?.Trim(),
            PhoneNumber = command.PhoneNumber?.Trim(),
            NormalizedPhoneNumber = normalizedPhoneNumber,
            IsActive = true
        };

        var createResult = await userManager.CreateAsync(user, command.Password);
        if (!createResult.Succeeded)
        {
            return ToOperationResult(createResult);
        }

        var roleResult = await userManager.AddToRoleAsync(user, UserRole.Buyer.ToString());
        return ToOperationResult(roleResult);
    }

    public async Task<IdentityAccount?> FindByLoginAsync(
        string? normalizedEmail,
        string? normalizedPhoneNumber,
        CancellationToken cancellationToken)
    {
        if (normalizedEmail is null && normalizedPhoneNumber is null)
        {
            return null;
        }

        var user = await applicationDbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(
                candidate =>
                    (normalizedEmail != null && candidate.NormalizedEmail == normalizedEmail) ||
                    (normalizedPhoneNumber != null && candidate.NormalizedPhoneNumber == normalizedPhoneNumber),
                cancellationToken);

        return user is null ? null : ToAccount(user);
    }

    public async Task<IdentityAccount?> FindByIdAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await applicationDbContext.Users.AsNoTracking().FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);
        return user is null ? null : ToAccount(user);
    }

    public async Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is not null && await userManager.CheckPasswordAsync(user, password);
    }

    public async Task<IReadOnlyCollection<string>> GetRolesAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException("The account could not be loaded.");

        return (await userManager.GetRolesAsync(user)).ToArray();
    }

    public async Task<string?> GenerateEmailConfirmationTokenAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null ? null : await userManager.GenerateEmailConfirmationTokenAsync(user);
    }

    public async Task<IdentityOperationResult> ConfirmEmailAsync(ConfirmEmailCommand command, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(command.UserId);
        return user is null
            ? Failure("The account does not exist.")
            : ToOperationResult(await userManager.ConfirmEmailAsync(user, command.Token));
    }

    public async Task<IdentityOperationResult> SavePhoneVerificationCodeAsync(
        string userId,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        var tokenValue = $"{expiresAtUtc.Ticks}:{Hash(code)}";
        return ToOperationResult(await userManager.SetAuthenticationTokenAsync(
            user,
            PHONE_OTP_LOGIN_PROVIDER,
            PHONE_OTP_TOKEN_NAME,
            tokenValue));
    }

    public async Task<IdentityOperationResult> ConfirmPhoneAsync(ConfirmPhoneCommand command, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(command.UserId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        var tokenValue = await userManager.GetAuthenticationTokenAsync(user, PHONE_OTP_LOGIN_PROVIDER, PHONE_OTP_TOKEN_NAME);
        if (!TryReadPhoneVerificationToken(tokenValue, out var expiresAtUtc, out var codeHash) || expiresAtUtc <= DateTime.UtcNow)
        {
            return Failure("The verification code is invalid or expired.");
        }

        var expectedHash = Convert.FromHexString(codeHash);
        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(command.Code));
        if (!CryptographicOperations.FixedTimeEquals(expectedHash, actualHash))
        {
            return Failure("The verification code is invalid or expired.");
        }

        user.PhoneNumberConfirmed = true;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return ToOperationResult(updateResult);
        }

        await userManager.RemoveAuthenticationTokenAsync(user, PHONE_OTP_LOGIN_PROVIDER, PHONE_OTP_TOKEN_NAME);
        return IdentityOperationResult.SUCCESS;
    }

    public async Task<IdentityOperationResult> SetUserActiveAsync(string userId, bool isActive, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        if (!isActive && user.IsActive && await userManager.IsInRoleAsync(user, UserRole.Admin.ToString()))
        {
            var activeAdminCount = await CountActiveAdminsAsync(cancellationToken);
            if (!LastActiveAdminPolicy.CanDeactivateOrDelete(activeAdminCount))
            {
                return Failure("The last active administrator cannot be locked or deleted.");
            }
        }

        user.IsActive = isActive;
        return ToOperationResult(await userManager.UpdateAsync(user));
    }

    public Task<int> CountActiveAdminsAsync(CancellationToken cancellationToken)
    {
        var adminRoleName = UserRole.Admin.ToString().ToUpperInvariant();
        return applicationDbContext.Users
            .Where(user => user.IsActive)
            .Join(
                applicationDbContext.UserRoles,
                user => user.Id,
                userRole => userRole.UserId,
                (user, userRole) => userRole)
            .Join(
                applicationDbContext.Roles.Where(role => role.NormalizedName == adminRoleName),
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => userRole)
            .CountAsync(cancellationToken);
    }

    private Task<bool> ContactAlreadyExistsAsync(string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken)
    {
        return applicationDbContext.Users.AnyAsync(
            user =>
                (normalizedEmail != null && user.NormalizedEmail == normalizedEmail) ||
                (normalizedPhoneNumber != null && user.NormalizedPhoneNumber == normalizedPhoneNumber),
            cancellationToken);
    }

    private static IdentityAccount ToAccount(ApplicationUser user)
    {
        return new IdentityAccount(
            user.Id,
            user.Email,
            user.NormalizedEmail,
            user.PhoneNumber,
            user.NormalizedPhoneNumber,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed,
            user.IsActive);
    }

    private static IdentityOperationResult ToOperationResult(IdentityResult result)
    {
        return result.Succeeded
            ? IdentityOperationResult.SUCCESS
            : new IdentityOperationResult(false, result.Errors.Select(error => error.Description).ToArray());
    }

    private static IdentityOperationResult Failure(string error)
    {
        return new IdentityOperationResult(false, [error]);
    }

    private static string Hash(string value)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    }

    private static bool TryReadPhoneVerificationToken(string? tokenValue, out DateTime expiresAtUtc, out string codeHash)
    {
        expiresAtUtc = default;
        codeHash = string.Empty;

        var parts = tokenValue?.Split(':', 2);
        if (parts is not { Length: 2 } || !long.TryParse(parts[0], out var ticks))
        {
            return false;
        }

        try
        {
            expiresAtUtc = new DateTime(ticks, DateTimeKind.Utc);
            codeHash = parts[1];
            return Convert.FromHexString(codeHash).Length == 32;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
