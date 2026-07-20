namespace GroceryStore.Application.Features.Auth;

public sealed record ContactChangeConfirmationResult(bool Succeeded, string? NewValue, IReadOnlyCollection<string> Errors)
{
    public static ContactChangeConfirmationResult Failure(string error) => new(false, null, [error]);
}
