namespace GroceryStore.Application.Abstractions.Shipping;

public interface IShippingDistanceService
{
    Task<ShippingDistanceResult> GetDistanceAsync(string destinationAddress, CancellationToken cancellationToken);
}

public sealed record ShippingDistanceResult(decimal? DistanceKm, string? ErrorMessage);
