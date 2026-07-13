namespace GroceryStore.Infrastructure.Shipping;

public sealed class ShippingOptions
{
    public const string SECTION_NAME = "Goong";
    public string ApiKey { get; init; } = string.Empty;
    public string OriginAddress { get; init; } = string.Empty;
    public decimal AutoShippingRadiusKm { get; init; } = 5m;
    public decimal BaseShippingFee { get; init; } = 10000m;
}
