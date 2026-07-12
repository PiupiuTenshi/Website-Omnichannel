namespace GroceryStore.Application.Features.Auth;

public sealed record IdentityOperationResult(bool Succeeded, IReadOnlyCollection<string> Errors)
{
    public static readonly IdentityOperationResult SUCCESS = new(true, Array.Empty<string>());
}
