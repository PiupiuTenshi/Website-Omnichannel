using System.Net;
using System.Net.Http.Json;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class PasswordResetEndpointTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Theory]
    [InlineData("https://untrusted.example/reset-password")]
    [InlineData("http://localhost:5173/reset-password#fragment")]
    [InlineData("http://localhost:5173/reset-password?next=elsewhere")]
    public async Task PasswordReset_RejectsUntrustedOrNonCanonicalUrl(string resetUrl)
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/password-resets", new { identifier = "test@example.test", resetUrl });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PasswordReset_AcceptsConfiguredWorkerOrigin()
    {
        using var app = factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Auth:PasswordResetAllowedOrigins:0", "https://shop.example");
            builder.ConfigureTestServices(services => services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase("password-reset-" + Guid.NewGuid())));
        });
        using var client = app.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/password-resets", new
        {
            identifier = "missing@example.test",
            resetUrl = "https://shop.example/reset-password"
        });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
    }
}
