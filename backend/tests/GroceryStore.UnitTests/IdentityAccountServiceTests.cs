using GroceryStore.Application.Features.Auth;
using GroceryStore.Domain.Enums;
using GroceryStore.Persistence.Authentication;
using GroceryStore.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.UnitTests;

public sealed class IdentityAccountServiceTests
{
    [Fact]
    public async Task CreateBuyerAsync_RejectsDuplicateNormalizedEmail()
    {
        await using var scope = await CreateScopeAsync();
        var service = scope.ServiceProvider.GetRequiredService<IdentityAccountService>();

        var firstResult = await service.CreateBuyerAsync(
            new RegisterUserCommand("buyer@example.com", null, "password1"),
            "BUYER@EXAMPLE.COM",
            null,
            CancellationToken.None);
        var duplicateResult = await service.CreateBuyerAsync(
            new RegisterUserCommand(" BUYER@example.com ", null, "password1"),
            "BUYER@EXAMPLE.COM",
            null,
            CancellationToken.None);

        Assert.True(firstResult.Succeeded);
        Assert.False(duplicateResult.Succeeded);
    }

    [Fact]
    public async Task CreateBuyerAsync_RejectsDuplicateNormalizedPhoneNumber()
    {
        await using var scope = await CreateScopeAsync();
        var service = scope.ServiceProvider.GetRequiredService<IdentityAccountService>();

        var firstResult = await service.CreateBuyerAsync(
            new RegisterUserCommand(null, "0898 087 507", "password1"),
            null,
            "0898087507",
            CancellationToken.None);
        var duplicateResult = await service.CreateBuyerAsync(
            new RegisterUserCommand(null, "0898087507", "password1"),
            null,
            "0898087507",
            CancellationToken.None);

        Assert.True(firstResult.Succeeded);
        Assert.False(duplicateResult.Succeeded);
    }

    [Fact]
    public async Task SetUserActiveAsync_RejectsLockingLastActiveAdministrator()
    {
        await using var scope = await CreateScopeAsync();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var service = scope.ServiceProvider.GetRequiredService<IdentityAccountService>();
        var administrator = new ApplicationUser
        {
            UserName = "ADMIN@EXAMPLE.COM",
            Email = "admin@example.com",
            EmailConfirmed = true,
            IsActive = true
        };

        Assert.True((await userManager.CreateAsync(administrator, "password1")).Succeeded);
        Assert.True((await userManager.AddToRoleAsync(administrator, UserRole.Admin.ToString())).Succeeded);

        var result = await service.SetUserActiveAsync(administrator.Id, false, CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains(result.Errors, error => error.Contains("last active administrator", StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<AsyncServiceScope> CreateScopeAsync()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
            })
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        services.AddScoped<IdentityAccountService>();

        var provider = services.BuildServiceProvider();
        var scope = provider.CreateAsyncScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in Enum.GetValues<UserRole>())
        {
            await roleManager.CreateAsync(new IdentityRole(role.ToString()));
        }

        return scope;
    }
}
