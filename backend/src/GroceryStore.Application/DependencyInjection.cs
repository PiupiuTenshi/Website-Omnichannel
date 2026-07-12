using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Features.StoreSettings;
using GroceryStore.Application.Features.Catalog;
using Microsoft.Extensions.DependencyInjection;

namespace GroceryStore.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<AuthService>();
        services.AddScoped<StoreSettingsService>();
        services.AddScoped<CatalogService>();
        services.AddScoped<ProductImageService>();
        return services;
    }
}
