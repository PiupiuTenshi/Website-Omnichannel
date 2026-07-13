namespace GroceryStore.Api.Contracts;

public sealed record SetShippingQuoteRequest(decimal ShippingFee, string Message);
