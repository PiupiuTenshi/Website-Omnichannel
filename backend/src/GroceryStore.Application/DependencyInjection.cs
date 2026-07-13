using GroceryStore.Application.Features.Auth;
using GroceryStore.Application.Features.StoreSettings;
using GroceryStore.Application.Features.Catalog;
using GroceryStore.Application.Features.Inventory;
using GroceryStore.Application.Features.Pos;
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
        services.AddScoped<InventoryService>();
        services.AddScoped<PosService>();
        return services;
    }
}
