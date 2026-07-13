using System.Net.Http.Json;
using System.Text.Json.Serialization;
using GroceryStore.Application.Abstractions.Shipping;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GroceryStore.Infrastructure.Shipping;

public sealed class GoongShippingDistanceService(HttpClient httpClient, IOptions<ShippingOptions> options, ILogger<GoongShippingDistanceService> logger) : IShippingDistanceService
{
    public async Task<ShippingDistanceResult> GetDistanceAsync(string destinationAddress, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.OriginAddress))
        {
            return new ShippingDistanceResult(null, "Shipping distance is unavailable. A manager will provide a quote.");
        }

        try
        {
            var origin = await GeocodeAsync(settings.OriginAddress, settings.ApiKey, cancellationToken);
            var destination = await GeocodeAsync(destinationAddress, settings.ApiKey, cancellationToken);
            if (origin is null || destination is null)
            {
                return new ShippingDistanceResult(null, "The delivery address could not be located. A manager will provide a quote.");
            }

            var path = $"Direction?origin={origin.Latitude},{origin.Longitude}&destination={destination.Latitude},{destination.Longitude}&vehicle=car&api_key={Uri.EscapeDataString(settings.ApiKey)}";
            var response = await httpClient.GetFromJsonAsync<DirectionResponse>(path, cancellationToken);
            var meters = response?.Routes?.FirstOrDefault()?.Legs?.FirstOrDefault()?.Distance?.Value;
            return meters is > 0
                ? new ShippingDistanceResult(decimal.Round(meters.Value / 1000m, 2), null)
                : new ShippingDistanceResult(null, "Route distance is unavailable. A manager will provide a quote.");
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException or NotSupportedException)
        {
            logger.LogWarning(exception, "Goong shipping distance lookup failed.");
            return new ShippingDistanceResult(null, "Shipping distance is temporarily unavailable. A manager will provide a quote.");
        }
    }

    private async Task<Coordinate?> GeocodeAsync(string address, string apiKey, CancellationToken cancellationToken)
    {
        var path = $"Geocode?address={Uri.EscapeDataString(address)}&api_key={Uri.EscapeDataString(apiKey)}";
        var response = await httpClient.GetFromJsonAsync<GeocodeResponse>(path, cancellationToken);
        var location = response?.Results?.FirstOrDefault()?.Geometry?.Location;
        return location is null ? null : new Coordinate(location.Latitude, location.Longitude);
    }

    private sealed record Coordinate(decimal Latitude, decimal Longitude);
    private sealed class GeocodeResponse { public List<GeocodeResult>? Results { get; init; } }
    private sealed class GeocodeResult { public Geometry? Geometry { get; init; } }
    private sealed class Geometry { public Location? Location { get; init; } }
    private sealed class Location
    {
        [JsonPropertyName("lat")]
        public decimal Latitude { get; init; }

        [JsonPropertyName("lng")]
        public decimal Longitude { get; init; }
    }
    private sealed class DirectionResponse { public List<Route>? Routes { get; init; } }
    private sealed class Route { public List<Leg>? Legs { get; init; } }
    private sealed class Leg { public Distance? Distance { get; init; } }
    private sealed class Distance { public decimal Value { get; init; } }
}
