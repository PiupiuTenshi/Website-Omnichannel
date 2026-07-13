namespace GroceryStore.Application.Abstractions.Shipping;

public interface IShippingQuotePolicy
{
    ShippingQuoteDecision Decide(decimal? distanceKm);
}

public sealed record ShippingQuoteDecision(decimal? ShippingFee, bool RequiresManagerQuote);
