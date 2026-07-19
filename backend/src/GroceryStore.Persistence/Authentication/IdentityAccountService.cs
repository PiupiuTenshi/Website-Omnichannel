using System.Security.Cryptography;
using System.Text;
using GroceryStore.Application.Abstractions.Authentication;
using GroceryStore.Application.Features.Auth;
using GroceryStore.Domain.Enums;
using GroceryStore.Domain.Rules;
using GroceryStore.Domain.ValueObjects;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GroceryStore.Persistence.Authentication;

public sealed class IdentityAccountService : IIdentityAccountService
{
    private const string PHONE_OTP_LOGIN_PROVIDER = "PhoneOtp";
    private const string PHONE_OTP_TOKEN_NAME = "VerificationCode";
    private const string EMAIL_OTP_LOGIN_PROVIDER = "EmailOtp";
    private const string EMAIL_OTP_TOKEN_NAME = "VerificationCode";
    private const string CONTACT_CHANGE_LOGIN_PROVIDER = "ContactChange";

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

    public async Task<IdentityOperationResult> UpdateProfileAsync(
        string userId,
        string? displayName,
        string? defaultDeliveryAddress,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        user.DisplayName = NormalizeOptionalValue(displayName, 120, "Display name");
        user.DefaultDeliveryAddress = NormalizeOptionalValue(defaultDeliveryAddress, 300, "Delivery address");
        return ToOperationResult(await userManager.UpdateAsync(user));
    }

    public async Task<IdentityOperationResult> SaveContactChangeRequestAsync(
        string userId,
        ContactChangeChannel channel,
        string newValue,
        string normalizedNewValue,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        var currentContactIsVerified = channel == ContactChangeChannel.Email
            ? !string.IsNullOrWhiteSpace(user.Email) && user.EmailConfirmed
            : !string.IsNullOrWhiteSpace(user.PhoneNumber) && user.PhoneNumberConfirmed;
        if (!currentContactIsVerified)
        {
            return Failure("The current contact method must be verified before it can be changed.");
        }

        if (await ContactAlreadyExistsAsync(channel, normalizedNewValue, userId, cancellationToken))
        {
            return Failure("Another account already uses this contact method.");
        }

        var tokenValue = string.Join(':', expiresAtUtc.Ticks, Convert.ToBase64String(Encoding.UTF8.GetBytes(newValue)), Convert.ToBase64String(Encoding.UTF8.GetBytes(normalizedNewValue)), Hash(code));
        return ToOperationResult(await userManager.SetAuthenticationTokenAsync(
            user,
            CONTACT_CHANGE_LOGIN_PROVIDER,
            channel.ToString(),
            tokenValue));
    }

    public async Task<ContactChangeConfirmationResult> ConfirmContactChangeAsync(
        string userId,
        ContactChangeChannel channel,
        string code,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return ContactChangeConfirmationResult.Failure("The account does not exist.");
        }

        var tokenValue = await userManager.GetAuthenticationTokenAsync(user, CONTACT_CHANGE_LOGIN_PROVIDER, channel.ToString());
        if (!TryReadContactChangeToken(tokenValue, out var expiresAtUtc, out var newValue, out var normalizedNewValue, out var codeHash) || expiresAtUtc <= utcNow)
        {
            return ContactChangeConfirmationResult.Failure("The confirmation code is invalid or expired.");
        }

        var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        if (!CryptographicOperations.FixedTimeEquals(codeHash, actualHash))
        {
            return ContactChangeConfirmationResult.Failure("The confirmation code is invalid or expired.");
        }

        if (await ContactAlreadyExistsAsync(channel, normalizedNewValue, userId, cancellationToken))
        {
            return ContactChangeConfirmationResult.Failure("Another account already uses this contact method.");
        }

        if (channel == ContactChangeChannel.Email)
        {
            user.Email = newValue;
            user.UserName = normalizedNewValue;
            user.NormalizedEmail = normalizedNewValue;
            user.NormalizedUserName = normalizedNewValue;
            user.EmailConfirmed = true;
        }
        else
        {
            user.PhoneNumber = newValue;
            user.NormalizedPhoneNumber = normalizedNewValue;
            user.PhoneNumberConfirmed = true;
        }

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return new ContactChangeConfirmationResult(false, null, updateResult.Errors.Select(error => error.Description).ToArray());
        }

        await userManager.RemoveAuthenticationTokenAsync(user, CONTACT_CHANGE_LOGIN_PROVIDER, channel.ToString());
        return new ContactChangeConfirmationResult(true, newValue, Array.Empty<string>());
    }

    public async Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is not null && await userManager.CheckPasswordAsync(user, password);
    }

    public async Task<IdentityOperationResult> ChangePasswordAsync(
        string userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        return ToOperationResult(await userManager.ChangePasswordAsync(user, currentPassword, newPassword));
    }

    public async Task<string?> GeneratePasswordResetTokenAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null ? null : await userManager.GeneratePasswordResetTokenAsync(user);
    }

    public async Task<IdentityOperationResult> ResetPasswordAsync(string userId, string token, string newPassword, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        return user is null
            ? Failure("The password reset request is invalid.")
            : ToOperationResult(await userManager.ResetPasswordAsync(user, token, newPassword));
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
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        var otpTokenValue = await userManager.GetAuthenticationTokenAsync(user, EMAIL_OTP_LOGIN_PROVIDER, EMAIL_OTP_TOKEN_NAME);
        if (TryReadPhoneVerificationToken(otpTokenValue, out var expiresAtUtc, out var codeHash))
        {
            var actualHash = SHA256.HashData(Encoding.UTF8.GetBytes(command.Token));
            if (expiresAtUtc <= DateTime.UtcNow || !CryptographicOperations.FixedTimeEquals(Convert.FromHexString(codeHash), actualHash))
            {
                return Failure("The email verification code is invalid or expired.");
            }

            user.EmailConfirmed = true;
            var updateResult = await userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return ToOperationResult(updateResult);
            }

            await userManager.RemoveAuthenticationTokenAsync(user, EMAIL_OTP_LOGIN_PROVIDER, EMAIL_OTP_TOKEN_NAME);
            return IdentityOperationResult.SUCCESS;
        }

        return ToOperationResult(await userManager.ConfirmEmailAsync(user, command.Token));
    }

    public async Task<IdentityOperationResult> SaveEmailVerificationCodeAsync(string userId, string code, DateTime expiresAtUtc, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        return ToOperationResult(await userManager.SetAuthenticationTokenAsync(user, EMAIL_OTP_LOGIN_PROVIDER, EMAIL_OTP_TOKEN_NAME, $"{expiresAtUtc.Ticks}:{Hash(code)}"));
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
        user.RequiresInitialActivation = false;
        return ToOperationResult(await userManager.UpdateAsync(user));
    }

    public async Task<IdentityOperationResult> ActivateOnFirstSignInAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        if (user.IsActive)
        {
            return IdentityOperationResult.SUCCESS;
        }

        if (!user.RequiresInitialActivation)
        {
            return Failure("The account is locked.");
        }

        user.IsActive = true;
        user.RequiresInitialActivation = false;
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

    public async Task<IReadOnlyCollection<UserAccountSummary>> GetAllUsersAsync(CancellationToken cancellationToken)
    {
        var users = await applicationDbContext.Users
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);

        var result = new List<UserAccountSummary>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new UserAccountSummary(
                user.Id,
                user.Email,
                user.PhoneNumber,
                user.EmailConfirmed,
                user.PhoneNumberConfirmed,
                user.IsActive,
                user.RequiresInitialActivation,
                roles.ToArray()));
        }

        return result;
    }

    public async Task<IdentityOperationResult> CreateUserWithRoleAsync(
        string? email,
        string? phoneNumber,
        string password,
        string role,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            return Failure($"'{role}' is not a valid role.");
        }

        EmailAddress.TryNormalize(email, out var normalizedEmail);
        PhoneNumber.TryNormalize(phoneNumber, out var normalizedPhoneNumber);
        if (normalizedEmail is null && normalizedPhoneNumber is null)
        {
            return Failure("An email address or phone number is required.");
        }

        if (await ContactAlreadyExistsAsync(normalizedEmail, normalizedPhoneNumber, cancellationToken))
        {
            return Failure("An account already uses this email address or phone number.");
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail ?? normalizedPhoneNumber,
            Email = email?.Trim(),
            PhoneNumber = phoneNumber?.Trim(),
            NormalizedPhoneNumber = normalizedPhoneNumber,
            EmailConfirmed = normalizedEmail is not null,
            PhoneNumberConfirmed = normalizedPhoneNumber is not null,
            IsActive = false,
            RequiresInitialActivation = true
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            return ToOperationResult(createResult);
        }

        var roleResult = await userManager.AddToRoleAsync(user, parsedRole.ToString());
        return ToOperationResult(roleResult);
    }

    public async Task<IdentityOperationResult> ChangeUserRoleAsync(
        string userId,
        string newRole,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<UserRole>(newRole, true, out var parsedRole))
        {
            return Failure($"'{newRole}' is not a valid role.");
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        var currentRoles = await userManager.GetRolesAsync(user);

        // Protect against removing the last active admin
        if (currentRoles.Contains(UserRole.Admin.ToString()) && parsedRole != UserRole.Admin)
        {
            if (user.IsActive)
            {
                var activeAdminCount = await CountActiveAdminsAsync(cancellationToken);
                if (!LastActiveAdminPolicy.CanDeactivateOrDelete(activeAdminCount))
                {
                    return Failure("Cannot change the role of the last active administrator.");
                }
            }
        }

        if (currentRoles.Count > 0)
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return ToOperationResult(removeResult);
            }
        }

        var addResult = await userManager.AddToRoleAsync(user, parsedRole.ToString());
        return ToOperationResult(addResult);
    }

    public async Task<IdentityOperationResult> DeleteUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return Failure("The account does not exist.");
        }

        if (await userManager.IsInRoleAsync(user, UserRole.Admin.ToString()) && user.IsActive)
        {
            var activeAdminCount = await CountActiveAdminsAsync(cancellationToken);
            if (!LastActiveAdminPolicy.CanDeactivateOrDelete(activeAdminCount))
            {
                return Failure("The last active administrator cannot be deactivated.");
            }
        }

        user.IsActive = false;
        var updateResult = await userManager.UpdateAsync(user);
        return ToOperationResult(updateResult);
    }

    private Task<bool> ContactAlreadyExistsAsync(string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken)
    {
        return applicationDbContext.Users.AnyAsync(
            user =>
                (normalizedEmail != null && user.NormalizedEmail == normalizedEmail) ||
                (normalizedPhoneNumber != null && user.NormalizedPhoneNumber == normalizedPhoneNumber),
            cancellationToken);
    }

    private Task<bool> ContactAlreadyExistsAsync(ContactChangeChannel channel, string normalizedValue, string userId, CancellationToken cancellationToken) =>
        channel == ContactChangeChannel.Email
            ? applicationDbContext.Users.AnyAsync(user => user.Id != userId && user.NormalizedEmail == normalizedValue, cancellationToken)
            : applicationDbContext.Users.AnyAsync(user => user.Id != userId && user.NormalizedPhoneNumber == normalizedValue, cancellationToken);

    private static IdentityAccount ToAccount(ApplicationUser user)
    {
        return new IdentityAccount(
            user.Id,
            user.Email,
            user.NormalizedEmail,
            user.PhoneNumber,
            user.NormalizedPhoneNumber,
            user.DisplayName,
            user.DefaultDeliveryAddress,
            user.EmailConfirmed,
            user.PhoneNumberConfirmed,
            user.IsActive,
            user.RequiresInitialActivation);
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

    private static string? NormalizeOptionalValue(string? value, int maxLength, string fieldName)
    {
        var trimmedValue = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmedValue))
        {
            return null;
        }

        if (trimmedValue.Length > maxLength)
        {
            throw new ArgumentException($"{fieldName} cannot exceed {maxLength} characters.");
        }

        return trimmedValue;
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

    private static bool TryReadContactChangeToken(string? tokenValue, out DateTime expiresAtUtc, out string newValue, out string normalizedNewValue, out byte[] codeHash)
    {
        expiresAtUtc = default;
        newValue = string.Empty;
        normalizedNewValue = string.Empty;
        codeHash = Array.Empty<byte>();
        var parts = tokenValue?.Split(':', 4);
        if (parts is not { Length: 4 } || !long.TryParse(parts[0], out var ticks))
        {
            return false;
        }

        try
        {
            expiresAtUtc = new DateTime(ticks, DateTimeKind.Utc);
            newValue = Encoding.UTF8.GetString(Convert.FromBase64String(parts[1]));
            normalizedNewValue = Encoding.UTF8.GetString(Convert.FromBase64String(parts[2]));
            codeHash = Convert.FromHexString(parts[3]);
            return codeHash.Length == 32;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
