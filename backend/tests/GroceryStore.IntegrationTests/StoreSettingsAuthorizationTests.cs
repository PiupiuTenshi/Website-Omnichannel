using System.Net;
using GroceryStore.Domain.Entities;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class StoreSettingsAuthorizationTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Theory]
    [InlineData("Admin", HttpStatusCode.OK)]
    [InlineData("Manager", HttpStatusCode.OK)]
    [InlineData("Seller", HttpStatusCode.Forbidden)]
    public async Task GetStoreSettings_EnforcesRoleAuthorizationAsync(string role, HttpStatusCode expectedStatusCode)
    {
        var databaseName = Guid.NewGuid().ToString();
        using var roleFactory = CreateFactory(databaseName);
        await InitializeStoreSettingsAsync(roleFactory);
        using var client = roleFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);

        var response = await client.GetAsync("/api/store-settings");

        Assert.Equal(expectedStatusCode, response.StatusCode);
    }

    private WebApplicationFactory<Program> CreateFactory(string databaseName)
    {
        return factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName));
            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationHandler.SCHEME_NAME;
                    options.DefaultChallengeScheme = TestAuthenticationHandler.SCHEME_NAME;
                    options.DefaultForbidScheme = TestAuthenticationHandler.SCHEME_NAME;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SCHEME_NAME, _ => { });
        }));
    }

    private static async Task InitializeStoreSettingsAsync(WebApplicationFactory<Program> factory)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var applicationDbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await applicationDbContext.Database.EnsureCreatedAsync();

        var settings = new StoreSettings("Test Store", "store@example.com", "1 Test Street");
        settings.Update("Test Store", "store@example.com", "1 Test Street", true, ["0898087507"]);
        applicationDbContext.StoreSettings.Add(settings);
        await applicationDbContext.SaveChangesAsync();
    }
}
