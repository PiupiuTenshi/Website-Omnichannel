using GroceryStore.Application.Abstractions.Shipping;
using Microsoft.Extensions.Options;

namespace GroceryStore.Infrastructure.Shipping;

public sealed class ShippingQuotePolicy(IOptions<ShippingOptions> options) : IShippingQuotePolicy
{
    public ShippingQuoteDecision Decide(decimal? distanceKm)
    {
        var settings = options.Value;
        return distanceKm is not null && distanceKm <= settings.AutoShippingRadiusKm
            ? new ShippingQuoteDecision(settings.BaseShippingFee, false)
            : new ShippingQuoteDecision(null, true);
    }
}
