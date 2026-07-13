namespace GroceryStore.IntegrationTests;

public sealed class SecurityHeadersTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Fact]
    public async Task HealthEndpoint_IncludesSecurityHeadersAsync()
    {
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/health");
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("Content-Security-Policy"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
    }
}
