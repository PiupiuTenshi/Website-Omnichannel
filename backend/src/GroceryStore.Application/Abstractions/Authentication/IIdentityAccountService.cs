using GroceryStore.Application.Features.Auth;

namespace GroceryStore.Application.Abstractions.Authentication;

public interface IIdentityAccountService
{
    Task<IdentityOperationResult> CreateBuyerAsync(RegisterUserCommand command, string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken);

    Task<IdentityAccount?> FindByLoginAsync(string? normalizedEmail, string? normalizedPhoneNumber, CancellationToken cancellationToken);

    Task<IdentityAccount?> FindByIdAsync(string userId, CancellationToken cancellationToken);

    Task<bool> CheckPasswordAsync(string userId, string password, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<string>> GetRolesAsync(string userId, CancellationToken cancellationToken);

    Task<string?> GenerateEmailConfirmationTokenAsync(string userId, CancellationToken cancellationToken);

    Task<IdentityOperationResult> ConfirmEmailAsync(ConfirmEmailCommand command, CancellationToken cancellationToken);

    Task<IdentityOperationResult> SavePhoneVerificationCodeAsync(string userId, string code, DateTime expiresAtUtc, CancellationToken cancellationToken);

    Task<IdentityOperationResult> ConfirmPhoneAsync(ConfirmPhoneCommand command, CancellationToken cancellationToken);

    Task<IdentityOperationResult> SetUserActiveAsync(string userId, bool isActive, CancellationToken cancellationToken);

    Task<int> CountActiveAdminsAsync(CancellationToken cancellationToken);
}
