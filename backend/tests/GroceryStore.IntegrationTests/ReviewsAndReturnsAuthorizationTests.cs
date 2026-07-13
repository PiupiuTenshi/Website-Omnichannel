using System.Net;
using System.Net.Http.Json;
using GroceryStore.Api.Contracts;
using GroceryStore.Domain.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.IntegrationTests;

public sealed class ReviewsAndReturnsAuthorizationTests(TestWebApplicationFactory factory) : IClassFixture<TestWebApplicationFactory>
{
    [Theory]
    [InlineData("Seller")]
    [InlineData("Manager")]
    public async Task CreateReview_RejectsNonBuyerRoleAsync(string role)
    {
        using var roleFactory = CreateFactory();
        using var client = roleFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        var response = await client.PostAsJsonAsync("/api/reviews", new CreateReviewRequest(Guid.NewGuid(), 5, "Review"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("Seller")]
    [InlineData("Manager")]
    public async Task CreateReturnRequest_RejectsNonBuyerRoleAsync(string role)
    {
        using var roleFactory = CreateFactory();
        using var client = roleFactory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", role);
        var response = await client.PostAsJsonAsync("/api/return-requests", new CreateReturnRequest(Guid.NewGuid(), ReturnReason.Damaged, "Damaged"));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private WebApplicationFactory<Program> CreateFactory() => factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthenticationHandler.SCHEME_NAME;
                options.DefaultChallengeScheme = TestAuthenticationHandler.SCHEME_NAME;
                options.DefaultForbidScheme = TestAuthenticationHandler.SCHEME_NAME;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(TestAuthenticationHandler.SCHEME_NAME, _ => { })));
}
