using System.Net;

namespace GroceryStore.IntegrationTests;

public sealed class HealthEndpointTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task HealthEndpoint_ReturnsOkAsync()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task StoreSettingsEndpoint_RejectsAnonymousRequestsAsync()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/store-settings");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
