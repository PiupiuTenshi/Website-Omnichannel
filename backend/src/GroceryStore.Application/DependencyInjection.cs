using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Features.StoreSettings;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<StoreSettingsService>();
        return services;
    }
}
